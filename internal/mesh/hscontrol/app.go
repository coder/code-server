package hscontrol

import (
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"net"
	"net/http"
	_ "net/http/pprof" // nolint
	"os"
	"os/signal"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/davecgh/go-spew/spew"
	"github.com/gorilla/mux"
	grpcRuntime "github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"github.com/juanfont/headscale"
	v1 "github.com/juanfont/headscale/gen/go/headscale/v1"
	"github.com/juanfont/headscale/hscontrol/capver"
	"github.com/juanfont/headscale/hscontrol/db"
	"github.com/juanfont/headscale/hscontrol/derp"
	derpServer "github.com/juanfont/headscale/hscontrol/derp/server"
	"github.com/juanfont/headscale/hscontrol/dns"
	"github.com/juanfont/headscale/hscontrol/mapper"
	"github.com/juanfont/headscale/hscontrol/notifier"
	"github.com/juanfont/headscale/hscontrol/state"
	"github.com/juanfont/headscale/hscontrol/types"
	"github.com/juanfont/headscale/hscontrol/util"
	zerolog "github.com/philip-bui/grpc-zerolog"
	"github.com/pkg/profile"
	zl "github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"golang.org/x/crypto/acme"
	"golang.org/x/crypto/acme/autocert"
	"golang.org/x/sync/errgroup"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/peer"
	"google.golang.org/grpc/reflection"
	"google.golang.org/grpc/status"
	"tailscale.com/envknob"
	"tailscale.com/tailcfg"
	"tailscale.com/types/dnstype"
	"tailscale.com/types/key"
	"tailscale.com/util/dnsname"
)

var (
	errSTUNAddressNotSet                   = errors.New("STUN address not set")
	errUnsupportedLetsEncryptChallengeType = errors.New(
		"unknown value for Lets Encrypt challenge type",
	)
	errEmptyInitialDERPMap = errors.New(
		"initial DERPMap is empty, Headscale requires at least one entry",
	)
)

const (
	AuthPrefix         = "Bearer "
	updateInterval     = 5 * time.Second
	privateKeyFileMode = 0o600
	headscaleDirPerm   = 0o700
)

// Headscale represents the base app of the service.
type Headscale struct {
	cfg             *types.Config
	state           *state.State
	noisePrivateKey *key.MachinePrivate
	ephemeralGC     *db.EphemeralGarbageCollector

	DERPServer *derpServer.DERPServer

	// Things that generate changes
	extraRecordMan *dns.ExtraRecordsMan
	mapper         *mapper.Mapper
	nodeNotifier   *notifier.Notifier
	authProvider   AuthProvider

	pollNetMapStreamWG sync.WaitGroup
}

var (
	profilingEnabled = envknob.Bool("HEADSCALE_DEBUG_PROFILING_ENABLED")
	profilingPath    = envknob.String("HEADSCALE_DEBUG_PROFILING_PATH")
	tailsqlEnabled   = envknob.Bool("HEADSCALE_DEBUG_TAILSQL_ENABLED")
	tailsqlStateDir  = envknob.String("HEADSCALE_DEBUG_TAILSQL_STATE_DIR")
	tailsqlTSKey     = envknob.String("TS_AUTHKEY")
	dumpConfig       = envknob.Bool("HEADSCALE_DEBUG_DUMP_CONFIG")
)

func NewHeadscale(cfg *types.Config) (*Headscale, error) {
	var err error
	if profilingEnabled {
		runtime.SetBlockProfileRate(1)
	}

	noisePrivateKey, err := readOrCreatePrivateKey(cfg.NoisePrivateKeyPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read or create Noise protocol private key: %w", err)
	}

	s, err := state.NewState(cfg)
	if err != nil {
		return nil, fmt.Errorf("init state: %w", err)
	}

	app := Headscale{
		cfg:                cfg,
		noisePrivateKey:    noisePrivateKey,
		pollNetMapStreamWG: sync.WaitGroup{},
		nodeNotifier:       notifier.NewNotifier(cfg),
		state:              s,
	}

	// Initialize ephemeral garbage collector
	ephemeralGC := db.NewEphemeralGarbageCollector(func(ni types.NodeID) {
		node, err := app.state.GetNodeByID(ni)
		if err != nil {
			log.Err(err).Uint64("node.id", ni.Uint64()).Msgf("failed to get ephemeral node for deletion")
			return
		}

		policyChanged, err := app.state.DeleteNode(node)
		if err != nil {
			log.Err(err).Uint64("node.id", ni.Uint64()).Msgf("failed to delete ephemeral node")
			return
		}

		// Send policy update notifications if needed
		if policyChanged {
			ctx := types.NotifyCtx(context.Background(), "ephemeral-gc-policy", node.Hostname)
			app.nodeNotifier.NotifyAll(ctx, types.UpdateFull())
		}

		log.Debug().Uint64("node.id", ni.Uint64()).Msgf("deleted ephemeral node")
	})
	app.ephemeralGC = ephemeralGC

	var authProvider AuthProvider
	authProvider = NewAuthProviderWeb(cfg.ServerURL)
	if cfg.OIDC.Issuer != "" {
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
		oidcProvider, err := NewAuthProviderOIDC(
			ctx,
			cfg.ServerURL,
			&cfg.OIDC,
			app.state,
			app.nodeNotifier,
		)
		if err != nil {
			if cfg.OIDC.OnlyStartIfOIDCIsAvailable {
				return nil, err
			} else {
				log.Warn().Err(err).Msg("failed to set up OIDC provider, falling back to CLI based authentication")
			}
		} else {
			authProvider = oidcProvider
		}
	}
	app.authProvider = authProvider

	if app.cfg.TailcfgDNSConfig != nil && app.cfg.TailcfgDNSConfig.Proxied { // if MagicDNS
		// TODO(kradalby): revisit why this takes a list.

		var magicDNSDomains []dnsname.FQDN
		if cfg.PrefixV4 != nil {
			magicDNSDomains = append(
				magicDNSDomains,
				util.GenerateIPv4DNSRootDomain(*cfg.PrefixV4)...)
		}
		if cfg.PrefixV6 != nil {
			magicDNSDomains = append(
				magicDNSDomains,
				util.GenerateIPv6DNSRootDomain(*cfg.PrefixV6)...)
		}

		// we might have routes already from Split DNS
		if app.cfg.TailcfgDNSConfig.Routes == nil {
			app.cfg.TailcfgDNSConfig.Routes = make(map[string][]*dnstype.Resolver)
		}
		for _, d := range magicDNSDomains {
			app.cfg.TailcfgDNSConfig.Routes[d.WithoutTrailingDot()] = nil
		}
	}

	if cfg.DERP.ServerEnabled {
		derpServerKey, err := readOrCreatePrivateKey(cfg.DERP.ServerPrivateKeyPath)
		if err != nil {
			return nil, fmt.Errorf("failed to read or create DERP server private key: %w", err)
		}

		if derpServerKey.Equal(*noisePrivateKey) {
			return nil, fmt.Errorf(
				"DERP server private key and noise private key are the same: %w",
				err,
			)
		}

		if cfg.DERP.ServerVerifyClients {
			t := http.DefaultTransport.(*http.Transport) //nolint:forcetypeassert
			t.RegisterProtocol(
				derpServer.DerpVerifyScheme,
				derpServer.NewDERPVerifyTransport(app.handleVerifyRequest),
			)
		}

		embeddedDERPServer, err := derpServer.NewDERPServer(
			cfg.ServerURL,
			key.NodePrivate(*derpServerKey),
			&cfg.DERP,
		)
		if err != nil {
			return nil, err
		}
		app.DERPServer = embeddedDERPServer
	}

	return &app, nil
}

// Redirect to our TLS url.
func (h *Headscale) redirect(w http.ResponseWriter, req *http.Request) {
	target := h.cfg.ServerURL + req.URL.RequestURI()
	http.Redirect(w, req, target, http.StatusFound)
}

func (h *Headscale) scheduledTasks(ctx context.Context) {
	expireTicker := time.NewTicker(updateInterval)
	defer expireTicker.Stop()

	lastExpiryCheck := time.Unix(0, 0)

	derpTickerChan := make(<-chan time.Time)
	if h.cfg.DERP.AutoUpdate && h.cfg.DERP.UpdateFrequency != 0 {
		derpTicker := time.NewTicker(h.cfg.DERP.UpdateFrequency)
		defer derpTicker.Stop()
		derpTickerChan = derpTicker.C
	}

	var extraRecordsUpdate <-chan []tailcfg.DNSRecord
	if h.extraRecordMan != nil {
		extraRecordsUpdate = h.extraRecordMan.UpdateCh()
	} else {
		extraRecordsUpdate = make(chan []tailcfg.DNSRecord)
	}

	for {
		select {
		case <-ctx.Done():
			log.Info().Caller().Msg("scheduled task worker is shutting down.")
			return

		case <-expireTicker.C:
			var update types.StateUpdate
			var changed bool

			lastExpiryCheck, update, changed = h.state.ExpireExpiredNodes(lastExpiryCheck)

			if changed {
				log.Trace().Interface("nodes", update.ChangePatches).Msgf("expiring nodes")

				ctx := types.NotifyCtx(context.Background(), "expire-expired", "na")
				h.nodeNotifier.NotifyAll(ctx, update)
			}

		case <-derpTickerChan:
			log.Info().Msg("Fetching DERPMap updates")
			derpMap := derp.GetDERPMap(h.cfg.DERP)
			if h.cfg.DERP.ServerEnabled && h.cfg.DERP.AutomaticallyAddEmbeddedDerpRegion {
				region, _ := h.DERPServer.GenerateRegion()
				derpMap.Regions[region.RegionID] = &region
			}

			ctx := types.NotifyCtx(context.Background(), "derpmap-update", "na")
			h.nodeNotifier.NotifyAll(ctx, types.StateUpdate{
				Type:    types.StateDERPUpdated,
				DERPMap: derpMap,
			})

		case records, ok := <-extraRecordsUpdate:
			if !ok {
				continue
			}
			h.cfg.TailcfgDNSConfig.ExtraRecords = records

			ctx := types.NotifyCtx(context.Background(), "dns-extrarecord", "all")
			// TODO(kradalby): We can probably do better than sending a full update here,
			// but for now this will ensure that all of the nodes get the new records.
			h.nodeNotifier.NotifyAll(ctx, types.UpdateFull())
		}
	}
}

func (h *Headscale) grpcAuthenticationInterceptor(ctx context.Context,
	req interface{},
	info *grpc.UnaryServerInfo,
	handler grpc.UnaryHandler,
) (interface{}, error) {
	// Check if the request is coming from the on-server client.
	// This is not secure, but it is to maintain maintainability
	// with the "legacy" database-based client
	// It is also needed for grpc-gateway to be able to connect to
	// the server
	client, _ := peer.FromContext(ctx)

	log.Trace().
		Caller().
		Str("client_address", client.Addr.String()).
		Msg("Client is trying to authenticate")

	meta, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return ctx, status.Errorf(
			codes.InvalidArgument,
			"Retrieving metadata is failed",
		)
	}

	authHeader, ok := meta["authorization"]
	if !ok {
		return ctx, status.Errorf(
			codes.Unauthenticated,
			"Authorization token is not supplied",
		)
	}

	token := authHeader[0]

	if !strings.HasPrefix(token, AuthPrefix) {
		return ctx, status.Error(
			codes.Unauthenticated,
			`missing "Bearer " prefix in "Authorization" header`,
		)
	}

	valid, err := h.state.ValidateAPIKey(strings.TrimPrefix(token, AuthPrefix))
	if err != nil {
		return ctx, status.Error(codes.Internal, "failed to validate token")
	}

	if !valid {
		log.Info().
			Str("client_address", client.Addr.String()).
			Msg("invalid token")

		return ctx, status.Error(codes.Unauthenticated, "invalid token")
	}

	return handler(ctx, req)
}

func (h *Headscale) httpAuthenticationMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(
		writer http.ResponseWriter,
		req *http.Request,
	) {
		log.Trace().
			Caller().
			Str("client_address", req.RemoteAddr).
			Msg("HTTP authentication invoked")

		authHeader := req.Header.Get("authorization")

		if !strings.HasPrefix(authHeader, AuthPrefix) {
			log.Error().
				Caller().
				Str("client_address", req.RemoteAddr).
				Msg(`missing "Bearer " prefix in "Authorization" header`)
			writer.WriteHeader(http.StatusUnauthorized)
			_, err := writer.Write([]byte("Unauthorized"))
			if err != nil {
				log.Error().
					Caller().
					Err(err).
					Msg("Failed to write response")
			}

			return
		}

		valid, err := h.state.ValidateAPIKey(strings.TrimPrefix(authHeader, AuthPrefix))
		if err != nil {
			log.Error().
				Caller().
				Err(err).
				Str("client_address", req.RemoteAddr).
				Msg("failed to validate token")

			writer.WriteHeader(http.StatusInternalServerError)
			_, err := writer.Write([]byte("Unauthorized"))
			if err != nil {
				log.Error().
					Caller().
					Err(err).
					Msg("Failed to write response")
			}

			return
		}

		if !valid {
			log.Info().
				Str("client_address", req.RemoteAddr).
				Msg("invalid token")

			writer.WriteHeader(http.StatusUnauthorized)
			_, err := writer.Write([]byte("Unauthorized"))
			if err != nil {
				log.Error().
					Caller().
					Err(err).
					Msg("Failed to write response")
			}

			return
		}

		next.ServeHTTP(writer, req)
	})
}

// ensureUnixSocketIsAbsent will check if the given path for headscales unix socket is clear
// and will remove it if it is not.
func (h *Headscale) ensureUnixSocketIsAbsent() error {
	// File does not exist, all fine
	if _, err := os.Stat(h.cfg.UnixSocket); errors.Is(err, os.ErrNotExist) {
		return nil
	}

	return os.Remove(h.cfg.UnixSocket)
}

func (h *Headscale) createRouter(grpcMux *grpcRuntime.ServeMux) *mux.Router {
	router := mux.NewRouter()
	router.Use(prometheusMiddleware)

	router.HandleFunc(ts2021UpgradePath, h.NoiseUpgradeHandler).
		Methods(http.MethodPost, http.MethodGet)

	router.HandleFunc("/health", h.HealthHandler).Methods(http.MethodGet)
	router.HandleFunc("/key", h.KeyHandler).Methods(http.MethodGet)
	router.HandleFunc("/register/{registration_id}", h.authProvider.RegisterHandler).
		Methods(http.MethodGet)

	if provider, ok := h.authProvider.(*AuthProviderOIDC); ok {
		router.HandleFunc("/oidc/callback", provider.OIDCCallbackHandler).Methods(http.MethodGet)
	}
	router.HandleFunc("/apple", h.AppleConfigMessage).Methods(http.MethodGet)
	router.HandleFunc("/apple/{platform}", h.ApplePlatformConfig).
		Methods(http.MethodGet)
	router.HandleFunc("/windows", h.WindowsConfigMessage).Methods(http.MethodGet)

	// TODO(kristoffer): move swagger into a package
	router.HandleFunc("/swagger", headscale.SwaggerUI).Methods(http.MethodGet)
	router.HandleFunc("/swagger/v1/openapiv2.json", headscale.SwaggerAPIv1).
		Methods(http.MethodGet)

	router.HandleFunc("/verify", h.VerifyHandler).Methods(http.MethodPost)

	if h.cfg.DERP.ServerEnabled {
		router.HandleFunc("/derp", h.DERPServer.DERPHandler)
		router.HandleFunc("/derp/probe", derpServer.DERPProbeHandler)
		router.HandleFunc("/derp/latency-check", derpServer.DERPProbeHandler)
		router.HandleFunc("/bootstrap-dns", derpServer.DERPBootstrapDNSHandler(h.state.DERPMap()))
	}

	apiRouter := router.PathPrefix("/api").Subrouter()
	apiRouter.Use(h.httpAuthenticationMiddleware)
	apiRouter.PathPrefix("/v1/").HandlerFunc(grpcMux.ServeHTTP)

	router.PathPrefix("/").HandlerFunc(notFoundHandler)

	return router
}

// // TODO(kradalby): Do a variant of this, and polman which only updates the node that has changed.
// // Maybe we should attempt a new in memory state and not go via the DB?
// // Maybe this should be implemented as an event bus?
// // A bool is returned indicating if a full update was sent to all nodes
// func usersChangedHook(db *db.HSDatabase, polMan policy.PolicyManager, notif *notifier.Notifier) error {
// 	users, err := db.ListUsers()
// 	if err != nil {
// 		return err
// 	}

// 	changed, err := polMan.SetUsers(users)
// 	if err != nil {
// 		return err
// 	}

// 	if changed {
// 		ctx := types.NotifyCtx(context.Background(), "acl-users-change", "all")
// 		notif.NotifyAll(ctx, types.UpdateFull())
// 	}

// 	return nil
// }

// // TODO(kradalby): Do a variant of this, and polman which only updates the node that has changed.
// // Maybe we should attempt a new in memory state and not go via the DB?
// // Maybe this should be implemented as an event bus?
// // A bool is returned indicating if a full update was sent to all nodes
// func nodesChangedHook(
// 	db *db.HSDatabase,
// 	polMan policy.PolicyManager,
// 	notif *notifier.Notifier,
// ) (bool, error) {
// 	nodes, err := db.ListNodes()
// 	if err != nil {
// 		return false, err
// 	}

// 	filterChanged, err := polMan.SetNodes(nodes)
// 	if err != nil {
// 		return false, err
// 	}

// 	if filterChanged {
// 		ctx := types.NotifyCtx(context.Background(), "acl-nodes-change", "all")
// 		notif.NotifyAll(ctx, types.UpdateFull())

// 		return true, nil
// 	}

// 	return false, nil
// }

// Serve launches the HTTP and gRPC server service Headscale and the API.
func (h *Headscale) Serve() error {
	capver.CanOldCodeBeCleanedUp()

	if profilingEnabled {
		if profilingPath != "" {
			err := os.MkdirAll(profilingPath, os.ModePerm)
			if err != nil {
				log.Fatal().Err(err).Msg("failed to create profiling directory")
			}

			defer profile.Start(profile.ProfilePath(profilingPath)).Stop()
		} else {
			defer profile.Start().Stop()
		}
	}

	if dumpConfig {
		spew.Dump(h.cfg)
	}

	log.Info().Str("version", types.Version).Str("commit", types.GitCommitHash).Msg("Starting Headscale")
	log.Info().
		Str("minimum_version", capver.TailscaleVersion(capver.MinSupportedCapabilityVersion)).
		Msg("Clients with a lower minimum version will be rejected")

	// Fetch an initial DERP Map before we start serving
	h.mapper = mapper.NewMapper(h.state, h.cfg, h.nodeNotifier)

	// TODO(kradalby): fix state part.
	if h.cfg.DERP.ServerEnabled {
		// When embedded DERP is enabled we always need a STUN server
		if h.cfg.DERP.STUNAddr == "" {
			return errSTUNAddressNotSet
		}

		region, err := h.DERPServer.GenerateRegion()
		if err != nil {
			return fmt.Errorf("generating DERP region for embedded server: %w", err)
		}

		if h.cfg.DERP.AutomaticallyAddEmbeddedDerpRegion {
			h.state.DERPMap().Regions[region.RegionID] = &region
		}

		go h.DERPServer.ServeSTUN()
	}

	if len(h.state.DERPMap().Regions) == 0 {
		return errEmptyInitialDERPMap
	}

	// Start ephemeral node garbage collector and schedule all nodes
	// that are already in the database and ephemeral. If they are still
	// around between restarts, they will reconnect and the GC will
	// be cancelled.
	go h.ephemeralGC.Start()
	ephmNodes, err := h.state.ListEphemeralNodes()
	if err != nil {
		return fmt.Errorf("failed to list ephemeral nodes: %w", err)
	}
	for _, node := range ephmNodes {
		h.ephemeralGC.Schedule(node.ID, h.cfg.EphemeralNodeInactivityTimeout)
	}

	if h.cfg.DNSConfig.ExtraRecordsPath != "" {
		h.extraRecordMan, err = dns.NewExtraRecordsManager(h.cfg.DNSConfig.ExtraRecordsPath)
		if err != nil {
			return fmt.Errorf("setting up extrarecord manager: %w", err)
		}
		h.cfg.TailcfgDNSConfig.ExtraRecords = h.extraRecordMan.Records()
		go h.extraRecordMan.Run()
		defer h.extraRecordMan.Close()
	}

	// Start all scheduled tasks, e.g. expiring nodes, derp updates and
	// records updates
	scheduleCtx, scheduleCancel := context.WithCancel(context.Background())
	defer scheduleCancel()
	go h.scheduledTasks(scheduleCtx)

	if zl.GlobalLevel() == zl.TraceLevel {
		zerolog.RespLog = true
	} else {
		zerolog.RespLog = false
	}

	// Prepare group for running listeners
	errorGroup := new(errgroup.Group)

	ctx := context.Background()
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	//
	//
	// Set up LOCAL listeners
	//

	err = h.ensureUnixSocketIsAbsent()
	if err != nil {
		return fmt.Errorf("unable to remove old socket file: %w", err)
	}

	socketDir := filepath.Dir(h.cfg.UnixSocket)
	err = util.EnsureDir(socketDir)
	if err != nil {
		return fmt.Errorf("setting up unix socket: %w", err)
	}

	socketListener, err := net.Listen("unix", h.cfg.UnixSocket)
	if err != nil {
		return fmt.Errorf("failed to set up gRPC socket: %w", err)
	}

	// Change socket permissions
	if err := os.Chmod(h.cfg.UnixSocket, h.cfg.UnixSocketPermission); err != nil {
		return fmt.Errorf("failed change permission of gRPC socket: %w", err)
	}

	grpcGatewayMux := grpcRuntime.NewServeMux()

	// Make the grpc-gateway connect to grpc over socket
	grpcGatewayConn, err := grpc.Dial(
		h.cfg.UnixSocket,
		[]grpc.DialOption{
			grpc.WithTransportCredentials(insecure.NewCredentials()),
			grpc.WithContextDialer(util.GrpcSocketDialer),
		}...,
	)
	if err != nil {
		return fmt.Errorf("setting up gRPC gateway via socket: %w", err)
	}

	// Connect to the gRPC server over localhost to skip
	// the authentication.
	err = v1.RegisterHeadscaleServiceHandler(ctx, grpcGatewayMux, grpcGatewayConn)
	if err != nil {
		return fmt.Errorf("registering Headscale API service to gRPC: %w", err)
	}

	// Start the local gRPC server without TLS and without authentication
	grpcSocket := grpc.NewServer(
	// Uncomment to debug grpc communication.
	// zerolog.UnaryInterceptor(),
	)

	v1.RegisterHeadscaleServiceServer(grpcSocket, newHeadscaleV1APIServer(h))
	reflection.Register(grpcSocket)

	errorGroup.Go(func() error { return grpcSocket.Serve(socketListener) })

	//
	//
	// Set up REMOTE listeners
	//

	tlsConfig, err := h.getTLSSettings()
	if err != nil {
		return fmt.Errorf("configuring TLS settings: %w", err)
	}

	//
	//
	// gRPC setup
	//

	// We are sadly not able to run gRPC and HTTPS (2.0) on the same
	// port because the connection mux does not support matching them
	// since they are so similar. There is multiple issues open and we
	// can revisit this if changes:
	// https://github.com/soheilhy/cmux/issues/68
	// https://github.com/soheilhy/cmux/issues/91

	var grpcServer *grpc.Server
	var grpcListener net.Listener
	if tlsConfig != nil || h.cfg.GRPCAllowInsecure {
		log.Info().Msgf("Enabling remote gRPC at %s", h.cfg.GRPCAddr)

		grpcOptions := []grpc.ServerOption{
			grpc.ChainUnaryInterceptor(
				h.grpcAuthenticationInterceptor,
				// Uncomment to debug grpc communication.
				// zerolog.NewUnaryServerInterceptor(),
			),
		}

		if tlsConfig != nil {
			grpcOptions = append(grpcOptions,
				grpc.Creds(credentials.NewTLS(tlsConfig)),
			)
		} else {
			log.Warn().Msg("gRPC is running without security")
		}

		grpcServer = grpc.NewServer(grpcOptions...)

		v1.RegisterHeadscaleServiceServer(grpcServer, newHeadscaleV1APIServer(h))
		reflection.Register(grpcServer)

		grpcListener, err = net.Listen("tcp", h.cfg.GRPCAddr)
		if err != nil {
			return fmt.Errorf("failed to bind to TCP address: %w", err)
		}

		errorGroup.Go(func() error { return grpcServer.Serve(grpcListener) })

		log.Info().
			Msgf("listening and serving gRPC on: %s", h.cfg.GRPCAddr)
	}

	//
	//
	// HTTP setup
	//
	// This is the regular router that we expose
	// over our main Addr
	router := h.createRouter(grpcGatewayMux)

	httpServer := &http.Server{
		Addr:        h.cfg.Addr,
		Handler:     router,
		ReadTimeout: types.HTTPTimeout,

		// Long polling should not have any timeout, this is overridden
		// further down the chain
		WriteTimeout: types.HTTPTimeout,
	}

	var httpListener net.Listener
	if tlsConfig != nil {
		httpServer.TLSConfig = tlsConfig
		httpListener, err = tls.Listen("tcp", h.cfg.Addr, tlsConfig)
	} else {
		httpListener, err = net.Listen("tcp", h.cfg.Addr)
	}
	if err != nil {
		return fmt.Errorf("failed to bind to TCP address: %w", err)
	}

	errorGroup.Go(func() error { return httpServer.Serve(httpListener) })

	log.Info().
		Msgf("listening and serving HTTP on: %s", h.cfg.Addr)

	debugHTTPListener, err := net.Listen("tcp", h.cfg.MetricsAddr)
	if err != nil {
		return fmt.Errorf("failed to bind to TCP address: %w", err)
	}

	debugHTTPServer := h.debugHTTPServer()
	errorGroup.Go(func() error { return debugHTTPServer.Serve(debugHTTPListener) })

	log.Info().
		Msgf("listening and serving debug and metrics on: %s", h.cfg.MetricsAddr)

	var tailsqlContext context.Context
	if tailsqlEnabled {
		if h.cfg.Database.Type != types.DatabaseSqlite {
			log.Fatal().
				Str("type", h.cfg.Database.Type).
				Msgf("tailsql only support %q", types.DatabaseSqlite)
		}
		if tailsqlTSKey == "" {
			log.Fatal().Msg("tailsql requires TS_AUTHKEY to be set")
		}
		tailsqlContext = context.Background()
		go runTailSQLService(ctx, util.TSLogfWrapper(), tailsqlStateDir, h.cfg.Database.Sqlite.Path)
	}

	// Handle common process-killing signals so we can gracefully shut down:
	sigc := make(chan os.Signal, 1)
	signal.Notify(sigc,
		syscall.SIGHUP,
		syscall.SIGINT,
		syscall.SIGTERM,
		syscall.SIGQUIT,
		syscall.SIGHUP)
	sigFunc := func(c chan os.Signal) {
		// Wait for a SIGINT or SIGKILL:
		for {
			sig := <-c
			switch sig {
			case syscall.SIGHUP:
				log.Info().
					Str("signal", sig.String()).
					Msg("Received SIGHUP, reloading ACL policy")

				if h.cfg.Policy.IsEmpty() {
					continue
				}

				changed, err := h.state.ReloadPolicy()
				if err != nil {
					log.Error().Err(err).Msgf("reloading policy")
					continue
				}

				if changed {
					log.Info().
						Msg("ACL policy successfully reloaded, notifying nodes of change")

					ctx := types.NotifyCtx(context.Background(), "acl-sighup", "na")
					h.nodeNotifier.NotifyAll(ctx, types.UpdateFull())
				}
			default:
				info := func(msg string) { log.Info().Msg(msg) }
				log.Info().
					Str("signal", sig.String()).
					Msg("Received signal to stop, shutting down gracefully")

				scheduleCancel()
				h.ephemeralGC.Close()

				// Gracefully shut down servers
				ctx, cancel := context.WithTimeout(
					context.Background(),
					types.HTTPShutdownTimeout,
				)
				info("shutting down debug http server")
				if err := debugHTTPServer.Shutdown(ctx); err != nil {
					log.Error().Err(err).Msg("failed to shutdown prometheus http")
				}
				info("shutting down main http server")
				if err := httpServer.Shutdown(ctx); err != nil {
					log.Error().Err(err).Msg("failed to shutdown http")
				}

				info("closing node notifier")
				h.nodeNotifier.Close()

				info("waiting for netmap stream to close")
				h.pollNetMapStreamWG.Wait()

				info("shutting down grpc server (socket)")
				grpcSocket.GracefulStop()

				if grpcServer != nil {
					info("shutting down grpc server (external)")
					grpcServer.GracefulStop()
					grpcListener.Close()
				}

				if tailsqlContext != nil {
					info("shutting down tailsql")
					tailsqlContext.Done()
				}

				// Close network listeners
				info("closing network listeners")
				debugHTTPListener.Close()
				httpListener.Close()
				grpcGatewayConn.Close()

				// Stop listening (and unlink the socket if unix type):
				info("closing socket listener")
				socketListener.Close()

				// Close db connections
				info("closing database connection")
				err = h.state.Close()
				if err != nil {
					log.Error().Err(err).Msg("failed to close db")
				}

				log.Info().
					Msg("Headscale stopped")

				// And we're done:
				cancel()

				return
			}
		}
	}
	errorGroup.Go(func() error {
		sigFunc(sigc)

		return nil
	})

	return errorGroup.Wait()
}

func (h *Headscale) getTLSSettings() (*tls.Config, error) {
	var err error
	if h.cfg.TLS.LetsEncrypt.Hostname != "" {
		if !strings.HasPrefix(h.cfg.ServerURL, "https://") {
			log.Warn().
				Msg("Listening with TLS but ServerURL does not start with https://")
		}

		certManager := autocert.Manager{
			Prompt:     autocert.AcceptTOS,
			HostPolicy: autocert.HostWhitelist(h.cfg.TLS.LetsEncrypt.Hostname),
			Cache:      autocert.DirCache(h.cfg.TLS.LetsEncrypt.CacheDir),
			Client: &acme.Client{
				DirectoryURL: h.cfg.ACMEURL,
			},
			Email: h.cfg.ACMEEmail,
		}

		switch h.cfg.TLS.LetsEncrypt.ChallengeType {
		case types.TLSALPN01ChallengeType:
			// Configuration via autocert with TLS-ALPN-01 (https://tools.ietf.org/html/rfc8737)
			// The RFC requires that the validation is done on port 443; in other words, headscale
			// must be reachable on port 443.
			return certManager.TLSConfig(), nil

		case types.HTTP01ChallengeType:
			// Configuration via autocert with HTTP-01. This requires listening on
			// port 80 for the certificate validation in addition to the headscale
			// service, which can be configured to run on any other port.

			server := &http.Server{
				Addr:        h.cfg.TLS.LetsEncrypt.Listen,
				Handler:     certManager.HTTPHandler(http.HandlerFunc(h.redirect)),
				ReadTimeout: types.HTTPTimeout,
			}

			go func() {
				err := server.ListenAndServe()
				log.Fatal().
					Caller().
					Err(err).
					Msg("failed to set up a HTTP server")
			}()

			return certManager.TLSConfig(), nil

		default:
			return nil, errUnsupportedLetsEncryptChallengeType
		}
	} else if h.cfg.TLS.CertPath == "" {
		if !strings.HasPrefix(h.cfg.ServerURL, "http://") {
			log.Warn().Msg("Listening without TLS but ServerURL does not start with http://")
		}

		return nil, err
	} else {
		if !strings.HasPrefix(h.cfg.ServerURL, "https://") {
			log.Warn().Msg("Listening with TLS but ServerURL does not start with https://")
		}

		tlsConfig := &tls.Config{
			NextProtos:   []string{"http/1.1"},
			Certificates: make([]tls.Certificate, 1),
			MinVersion:   tls.VersionTLS12,
		}

		tlsConfig.Certificates[0], err = tls.LoadX509KeyPair(h.cfg.TLS.CertPath, h.cfg.TLS.KeyPath)

		return tlsConfig, err
	}
}

func notFoundHandler(
	writer http.ResponseWriter,
	req *http.Request,
) {
	log.Trace().
		Interface("header", req.Header).
		Interface("proto", req.Proto).
		Interface("url", req.URL).
		Msg("Request did not match")
	writer.WriteHeader(http.StatusNotFound)
}

func readOrCreatePrivateKey(path string) (*key.MachinePrivate, error) {
	dir := filepath.Dir(path)
	err := util.EnsureDir(dir)
	if err != nil {
		return nil, fmt.Errorf("ensuring private key directory: %w", err)
	}

	privateKey, err := os.ReadFile(path)
	if errors.Is(err, os.ErrNotExist) {
		log.Info().Str("path", path).Msg("No private key file at path, creating...")

		machineKey := key.NewMachine()

		machineKeyStr, err := machineKey.MarshalText()
		if err != nil {
			return nil, fmt.Errorf(
				"failed to convert private key to string for saving: %w",
				err,
			)
		}
		err = os.WriteFile(path, machineKeyStr, privateKeyFileMode)
		if err != nil {
			return nil, fmt.Errorf(
				"failed to save private key to disk at path %q: %w",
				path,
				err,
			)
		}

		return &machineKey, nil
	} else if err != nil {
		return nil, fmt.Errorf("failed to read private key file: %w", err)
	}

	trimmedPrivateKey := strings.TrimSpace(string(privateKey))

	var machineKey key.MachinePrivate
	if err = machineKey.UnmarshalText([]byte(trimmedPrivateKey)); err != nil {
		return nil, fmt.Errorf("failed to parse private key: %w", err)
	}

	return &machineKey, nil
}
