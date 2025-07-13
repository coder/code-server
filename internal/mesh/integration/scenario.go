package integration

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/http/cookiejar"
	"net/netip"
	"net/url"
	"os"
	"sort"
	"strconv"
	"strings"
	"sync"
	"testing"
	"time"

	v1 "github.com/juanfont/headscale/gen/go/headscale/v1"
	"github.com/juanfont/headscale/hscontrol/capver"
	"github.com/juanfont/headscale/hscontrol/types"
	"github.com/juanfont/headscale/hscontrol/util"
	"github.com/juanfont/headscale/integration/dockertestutil"
	"github.com/juanfont/headscale/integration/dsic"
	"github.com/juanfont/headscale/integration/hsic"
	"github.com/juanfont/headscale/integration/tsic"
	"github.com/oauth2-proxy/mockoidc"
	"github.com/ory/dockertest/v3"
	"github.com/ory/dockertest/v3/docker"
	"github.com/puzpuzpuz/xsync/v4"
	"github.com/samber/lo"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	xmaps "golang.org/x/exp/maps"
	"golang.org/x/sync/errgroup"
	"tailscale.com/envknob"
	"tailscale.com/util/mak"
)

const (
	scenarioHashLength = 6
)

var usePostgresForTest = envknob.Bool("HEADSCALE_INTEGRATION_POSTGRES")

var (
	errNoHeadscaleAvailable = errors.New("no headscale available")
	errNoUserAvailable      = errors.New("no user available")
	errNoClientFound        = errors.New("client not found")

	// AllVersions represents a list of Tailscale versions the suite
	// uses to test compatibility with the ControlServer.
	//
	// The list contains two special cases, "head" and "unstable" which
	// points to the current tip of Tailscale's main branch and the latest
	// released unstable version.
	//
	// The rest of the version represents Tailscale versions that can be
	// found in Tailscale's apt repository.
	AllVersions = append([]string{"head", "unstable"}, capver.TailscaleLatestMajorMinor(10, true)...)

	// MustTestVersions is the minimum set of versions we should test.
	// At the moment, this is arbitrarily chosen as:
	//
	// - Two unstable (HEAD and unstable)
	// - Two latest versions
	// - Two oldest supported version.
	MustTestVersions = append(
		AllVersions[0:4],
		AllVersions[len(AllVersions)-2:]...,
	)
)

// User represents a User in the ControlServer and a map of TailscaleClient's
// associated with the User.
type User struct {
	Clients map[string]TailscaleClient

	createWaitGroup errgroup.Group
	joinWaitGroup   errgroup.Group
	syncWaitGroup   errgroup.Group
}

// Scenario is a representation of an environment with one ControlServer and
// one or more User's and its associated TailscaleClients.
// A Scenario is intended to simplify setting up a new testcase for testing
// a ControlServer with TailscaleClients.
// TODO(kradalby): make control server configurable, test correctness with Tailscale SaaS.
type Scenario struct {
	// TODO(kradalby): support multiple headcales for later, currently only
	// use one.
	controlServers *xsync.MapOf[string, ControlServer]
	derpServers    []*dsic.DERPServerInContainer

	users map[string]*User

	pool          *dockertest.Pool
	networks      map[string]*dockertest.Network
	mockOIDC      scenarioOIDC
	extraServices map[string][]*dockertest.Resource

	mu sync.Mutex

	spec          ScenarioSpec
	userToNetwork map[string]*dockertest.Network

	testHashPrefix     string
	testDefaultNetwork string
}

// ScenarioSpec describes the users, nodes, and network topology to
// set up for a given scenario.
type ScenarioSpec struct {
	// Users is a list of usernames that will be created.
	// Each created user will get nodes equivalent to NodesPerUser
	Users []string

	// NodesPerUser is how many nodes should be attached to each user.
	NodesPerUser int

	// Networks, if set, is the separate Docker networks that should be
	// created and a list of the users that should be placed in those networks.
	// If not set, a single network will be created and all users+nodes will be
	// added there.
	// Please note that Docker networks are not necessarily routable and
	// connections between them might fall back to DERP.
	Networks map[string][]string

	// ExtraService, if set, is additional a map of network to additional
	// container services that should be set up. These container services
	// typically dont run Tailscale, e.g. web service to test subnet router.
	ExtraService map[string][]extraServiceFunc

	// Versions is specific list of versions to use for the test.
	Versions []string

	// OIDCUsers, if populated, will start a Mock OIDC server and populate
	// the user login stack with the given users.
	// If the NodesPerUser is set, it should align with this list to ensure
	// the correct users are logged in.
	// This is because the MockOIDC server can only serve login
	// requests based on a queue it has been given on startup.
	// We currently only populates it with one login request per user.
	OIDCUsers     []mockoidc.MockUser
	OIDCAccessTTL time.Duration

	MaxWait time.Duration
}

func (s *Scenario) prefixedNetworkName(name string) string {
	return s.testHashPrefix + "-" + name
}

// NewScenario creates a test Scenario which can be used to bootstraps a ControlServer with
// a set of Users and TailscaleClients.
func NewScenario(spec ScenarioSpec) (*Scenario, error) {
	pool, err := dockertest.NewPool("")
	if err != nil {
		return nil, fmt.Errorf("could not connect to docker: %w", err)
	}

	// Opportunity to clean up unreferenced networks.
	// This might be a no op, but it is worth a try as we sometime
	// dont clean up nicely after ourselves.
	dockertestutil.CleanUnreferencedNetworks(pool)
	dockertestutil.CleanImagesInCI(pool)

	if spec.MaxWait == 0 {
		pool.MaxWait = dockertestMaxWait()
	} else {
		pool.MaxWait = spec.MaxWait
	}

	testHashPrefix := "hs-" + util.MustGenerateRandomStringDNSSafe(scenarioHashLength)
	s := &Scenario{
		controlServers: xsync.NewMapOf[string, ControlServer](),
		users:          make(map[string]*User),

		pool: pool,
		spec: spec,

		testHashPrefix:     testHashPrefix,
		testDefaultNetwork: testHashPrefix + "-default",
	}

	var userToNetwork map[string]*dockertest.Network
	if spec.Networks != nil || len(spec.Networks) != 0 {
		for name, users := range s.spec.Networks {
			networkName := testHashPrefix + "-" + name
			network, err := s.AddNetwork(networkName)
			if err != nil {
				return nil, err
			}

			for _, user := range users {
				if n2, ok := userToNetwork[user]; ok {
					return nil, fmt.Errorf("users can only have nodes placed in one network: %s into %s but already in %s", user, network.Network.Name, n2.Network.Name)
				}
				mak.Set(&userToNetwork, user, network)
			}
		}
	} else {
		_, err := s.AddNetwork(s.testDefaultNetwork)
		if err != nil {
			return nil, err
		}
	}

	for network, extras := range spec.ExtraService {
		for _, extra := range extras {
			svc, err := extra(s, network)
			if err != nil {
				return nil, err
			}
			mak.Set(&s.extraServices, s.prefixedNetworkName(network), append(s.extraServices[s.prefixedNetworkName(network)], svc))
		}
	}

	s.userToNetwork = userToNetwork

	if spec.OIDCUsers != nil && len(spec.OIDCUsers) != 0 {
		ttl := defaultAccessTTL
		if spec.OIDCAccessTTL != 0 {
			ttl = spec.OIDCAccessTTL
		}
		err = s.runMockOIDC(ttl, spec.OIDCUsers)
		if err != nil {
			return nil, err
		}
	}

	return s, nil
}

func (s *Scenario) AddNetwork(name string) (*dockertest.Network, error) {
	network, err := dockertestutil.GetFirstOrCreateNetwork(s.pool, name)
	if err != nil {
		return nil, fmt.Errorf("failed to create or get network: %w", err)
	}

	// We run the test suite in a docker container that calls a couple of endpoints for
	// readiness checks, this ensures that we can run the tests with individual networks
	// and have the client reach the different containers
	// TODO(kradalby): Can the test-suite be renamed so we can have multiple?
	err = dockertestutil.AddContainerToNetwork(s.pool, network, "headscale-test-suite")
	if err != nil {
		return nil, fmt.Errorf("failed to add test suite container to network: %w", err)
	}

	mak.Set(&s.networks, name, network)

	return network, nil
}

func (s *Scenario) Networks() []*dockertest.Network {
	if len(s.networks) == 0 {
		panic("Scenario.Networks called with empty network list")
	}
	return xmaps.Values(s.networks)
}

func (s *Scenario) Network(name string) (*dockertest.Network, error) {
	net, ok := s.networks[s.prefixedNetworkName(name)]
	if !ok {
		return nil, fmt.Errorf("no network named: %s", name)
	}

	return net, nil
}

func (s *Scenario) SubnetOfNetwork(name string) (*netip.Prefix, error) {
	net, ok := s.networks[s.prefixedNetworkName(name)]
	if !ok {
		return nil, fmt.Errorf("no network named: %s", name)
	}

	for _, ipam := range net.Network.IPAM.Config {
		pref, err := netip.ParsePrefix(ipam.Subnet)
		if err != nil {
			return nil, err
		}

		return &pref, nil
	}

	return nil, fmt.Errorf("no prefix found in network: %s", name)
}

func (s *Scenario) Services(name string) ([]*dockertest.Resource, error) {
	res, ok := s.extraServices[s.prefixedNetworkName(name)]
	if !ok {
		return nil, fmt.Errorf("no network named: %s", name)
	}

	return res, nil
}

func (s *Scenario) ShutdownAssertNoPanics(t *testing.T) {
	defer dockertestutil.CleanUnreferencedNetworks(s.pool)
	defer dockertestutil.CleanImagesInCI(s.pool)

	s.controlServers.Range(func(_ string, control ControlServer) bool {
		stdoutPath, stderrPath, err := control.Shutdown()
		if err != nil {
			log.Printf(
				"Failed to shut down control: %s",
				fmt.Errorf("failed to tear down control: %w", err),
			)
		}

		if t != nil {
			stdout, err := os.ReadFile(stdoutPath)
			require.NoError(t, err)
			assert.NotContains(t, string(stdout), "panic")

			stderr, err := os.ReadFile(stderrPath)
			require.NoError(t, err)
			assert.NotContains(t, string(stderr), "panic")
		}

		return true
	})

	for userName, user := range s.users {
		for _, client := range user.Clients {
			log.Printf("removing client %s in user %s", client.Hostname(), userName)
			stdoutPath, stderrPath, err := client.Shutdown()
			if err != nil {
				log.Printf("failed to tear down client: %s", err)
			}

			if t != nil {
				stdout, err := os.ReadFile(stdoutPath)
				require.NoError(t, err)
				assert.NotContains(t, string(stdout), "panic")

				stderr, err := os.ReadFile(stderrPath)
				require.NoError(t, err)
				assert.NotContains(t, string(stderr), "panic")
			}
		}
	}

	for _, derp := range s.derpServers {
		err := derp.Shutdown()
		if err != nil {
			log.Printf("failed to tear down derp server: %s", err)
		}
	}

	for _, svcs := range s.extraServices {
		for _, svc := range svcs {
			err := svc.Close()
			if err != nil {
				log.Printf("failed to tear down service %q: %s", svc.Container.Name, err)
			}
		}
	}

	if s.mockOIDC.r != nil {
		s.mockOIDC.r.Close()
		if err := s.mockOIDC.r.Close(); err != nil {
			log.Printf("failed to tear down oidc server: %s", err)
		}
	}

	for _, network := range s.networks {
		if err := network.Close(); err != nil {
			log.Printf("failed to tear down network: %s", err)
		}
	}
}

// Shutdown shuts down and cleans up all the containers (ControlServer, TailscaleClient)
// and networks associated with it.
// In addition, it will save the logs of the ControlServer to `/tmp/control` in the
// environment running the tests.
func (s *Scenario) Shutdown() {
	s.ShutdownAssertNoPanics(nil)
}

// Users returns the name of all users associated with the Scenario.
func (s *Scenario) Users() []string {
	users := make([]string, 0)
	for user := range s.users {
		users = append(users, user)
	}

	return users
}

/// Headscale related stuff
// Note: These functions assume that there is a _single_ headscale instance for now

// Headscale returns a ControlServer instance based on hsic (HeadscaleInContainer)
// If the Scenario already has an instance, the pointer to the running container
// will be return, otherwise a new instance will be created.
// TODO(kradalby): make port and headscale configurable, multiple instances support?
func (s *Scenario) Headscale(opts ...hsic.Option) (ControlServer, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if headscale, ok := s.controlServers.Load("headscale"); ok {
		return headscale, nil
	}

	if usePostgresForTest {
		opts = append(opts, hsic.WithPostgres())
	}

	headscale, err := hsic.New(s.pool, s.Networks(), opts...)
	if err != nil {
		return nil, fmt.Errorf("failed to create headscale container: %w", err)
	}

	err = headscale.WaitForRunning()
	if err != nil {
		return nil, fmt.Errorf("failed reach headscale container: %w", err)
	}

	s.controlServers.Store("headscale", headscale)

	return headscale, nil
}

// CreatePreAuthKey creates a "pre authentorised key" to be created in the
// Headscale instance on behalf of the Scenario.
func (s *Scenario) CreatePreAuthKey(
	user uint64,
	reusable bool,
	ephemeral bool,
) (*v1.PreAuthKey, error) {
	if headscale, err := s.Headscale(); err == nil {
		key, err := headscale.CreateAuthKey(user, reusable, ephemeral)
		if err != nil {
			return nil, fmt.Errorf("failed to create user: %w", err)
		}

		return key, nil
	}

	return nil, fmt.Errorf("failed to create user: %w", errNoHeadscaleAvailable)
}

// CreateUser creates a User to be created in the
// Headscale instance on behalf of the Scenario.
func (s *Scenario) CreateUser(user string) (*v1.User, error) {
	if headscale, err := s.Headscale(); err == nil {
		u, err := headscale.CreateUser(user)
		if err != nil {
			return nil, fmt.Errorf("failed to create user: %w", err)
		}

		s.users[user] = &User{
			Clients: make(map[string]TailscaleClient),
		}

		return u, nil
	}

	return nil, fmt.Errorf("failed to create user: %w", errNoHeadscaleAvailable)
}

/// Client related stuff

func (s *Scenario) CreateTailscaleNode(
	version string,
	opts ...tsic.Option,
) (TailscaleClient, error) {
	headscale, err := s.Headscale()
	if err != nil {
		return nil, fmt.Errorf("failed to create tailscale node (version: %s): %w", version, err)
	}

	cert := headscale.GetCert()
	hostname := headscale.GetHostname()

	s.mu.Lock()
	defer s.mu.Unlock()
	opts = append(opts,
		tsic.WithCACert(cert),
		tsic.WithHeadscaleName(hostname),
	)

	tsClient, err := tsic.New(
		s.pool,
		version,
		opts...,
	)
	if err != nil {
		return nil, fmt.Errorf(
			"failed to create tailscale node: %w",
			err,
		)
	}

	err = tsClient.WaitForNeedsLogin()
	if err != nil {
		return nil, fmt.Errorf(
			"failed to wait for tailscaled (%s) to need login: %w",
			tsClient.Hostname(),
			err,
		)
	}

	return tsClient, nil
}

// CreateTailscaleNodesInUser creates and adds a new TailscaleClient to a
// User in the Scenario.
func (s *Scenario) CreateTailscaleNodesInUser(
	userStr string,
	requestedVersion string,
	count int,
	opts ...tsic.Option,
) error {
	if user, ok := s.users[userStr]; ok {
		var versions []string
		for i := range count {
			version := requestedVersion
			if requestedVersion == "all" {
				if s.spec.Versions != nil {
					version = s.spec.Versions[i%len(s.spec.Versions)]
				} else {
					version = MustTestVersions[i%len(MustTestVersions)]
				}
			}
			versions = append(versions, version)

			headscale, err := s.Headscale()
			if err != nil {
				return fmt.Errorf("failed to create tailscale node (version: %s): %w", version, err)
			}

			cert := headscale.GetCert()
			hostname := headscale.GetHostname()

			s.mu.Lock()
			opts = append(opts,
				tsic.WithCACert(cert),
				tsic.WithHeadscaleName(hostname),
			)
			s.mu.Unlock()

			user.createWaitGroup.Go(func() error {
				s.mu.Lock()
				tsClient, err := tsic.New(
					s.pool,
					version,
					opts...,
				)
				s.mu.Unlock()
				if err != nil {
					return fmt.Errorf(
						"failed to create tailscale node: %w",
						err,
					)
				}

				err = tsClient.WaitForNeedsLogin()
				if err != nil {
					return fmt.Errorf(
						"failed to wait for tailscaled (%s) to need login: %w",
						tsClient.Hostname(),
						err,
					)
				}

				s.mu.Lock()
				user.Clients[tsClient.Hostname()] = tsClient
				s.mu.Unlock()

				return nil
			})
		}
		if err := user.createWaitGroup.Wait(); err != nil {
			return err
		}

		log.Printf("testing versions %v, MustTestVersions %v", lo.Uniq(versions), MustTestVersions)

		return nil
	}

	return fmt.Errorf("failed to add tailscale node: %w", errNoUserAvailable)
}

// RunTailscaleUp will log in all of the TailscaleClients associated with a
// User to the given ControlServer (by URL).
func (s *Scenario) RunTailscaleUp(
	userStr, loginServer, authKey string,
) error {
	if user, ok := s.users[userStr]; ok {
		for _, client := range user.Clients {
			c := client
			user.joinWaitGroup.Go(func() error {
				return c.Login(loginServer, authKey)
			})
		}

		if err := user.joinWaitGroup.Wait(); err != nil {
			return err
		}

		for _, client := range user.Clients {
			err := client.WaitForRunning()
			if err != nil {
				return fmt.Errorf("%s failed to up tailscale node: %w", client.Hostname(), err)
			}
		}

		return nil
	}

	return fmt.Errorf("failed to up tailscale node: %w", errNoUserAvailable)
}

// CountTailscale returns the total number of TailscaleClients in a Scenario.
// This is the sum of Users x TailscaleClients.
func (s *Scenario) CountTailscale() int {
	count := 0

	for _, user := range s.users {
		count += len(user.Clients)
	}

	return count
}

// WaitForTailscaleSync blocks execution until all the TailscaleClient reports
// to have all other TailscaleClients present in their netmap.NetworkMap.
func (s *Scenario) WaitForTailscaleSync() error {
	tsCount := s.CountTailscale()

	err := s.WaitForTailscaleSyncWithPeerCount(tsCount - 1)
	if err != nil {
		for _, user := range s.users {
			for _, client := range user.Clients {
				peers, allOnline, _ := client.FailingPeersAsString()
				if !allOnline {
					log.Println(peers)
				}
			}
		}
	}

	return err
}

// WaitForTailscaleSyncWithPeerCount blocks execution until all the TailscaleClient reports
// to have all other TailscaleClients present in their netmap.NetworkMap.
func (s *Scenario) WaitForTailscaleSyncWithPeerCount(peerCount int) error {
	for _, user := range s.users {
		for _, client := range user.Clients {
			c := client
			user.syncWaitGroup.Go(func() error {
				return c.WaitForPeers(peerCount)
			})
		}
		if err := user.syncWaitGroup.Wait(); err != nil {
			return err
		}
	}

	return nil
}

func (s *Scenario) CreateHeadscaleEnvWithLoginURL(
	tsOpts []tsic.Option,
	opts ...hsic.Option,
) error {
	return s.createHeadscaleEnv(true, tsOpts, opts...)
}

func (s *Scenario) CreateHeadscaleEnv(
	tsOpts []tsic.Option,
	opts ...hsic.Option,
) error {
	return s.createHeadscaleEnv(false, tsOpts, opts...)
}

// CreateHeadscaleEnv starts the headscale environment and the clients
// according to the ScenarioSpec passed to the Scenario.
func (s *Scenario) createHeadscaleEnv(
	withURL bool,
	tsOpts []tsic.Option,
	opts ...hsic.Option,
) error {
	headscale, err := s.Headscale(opts...)
	if err != nil {
		return err
	}

	sort.Strings(s.spec.Users)
	for _, user := range s.spec.Users {
		u, err := s.CreateUser(user)
		if err != nil {
			return err
		}

		var opts []tsic.Option
		if s.userToNetwork != nil {
			opts = append(tsOpts, tsic.WithNetwork(s.userToNetwork[user]))
		} else {
			opts = append(tsOpts, tsic.WithNetwork(s.networks[s.testDefaultNetwork]))
		}

		err = s.CreateTailscaleNodesInUser(user, "all", s.spec.NodesPerUser, opts...)
		if err != nil {
			return err
		}

		if withURL {
			err = s.RunTailscaleUpWithURL(user, headscale.GetEndpoint())
			if err != nil {
				return err
			}
		} else {
			key, err := s.CreatePreAuthKey(u.GetId(), true, false)
			if err != nil {
				return err
			}

			err = s.RunTailscaleUp(user, headscale.GetEndpoint(), key.GetKey())
			if err != nil {
				return err
			}
		}
	}

	return nil
}

func (s *Scenario) RunTailscaleUpWithURL(userStr, loginServer string) error {
	log.Printf("running tailscale up for user %s", userStr)
	if user, ok := s.users[userStr]; ok {
		for _, client := range user.Clients {
			tsc := client
			user.joinWaitGroup.Go(func() error {
				loginURL, err := tsc.LoginWithURL(loginServer)
				if err != nil {
					log.Printf("%s failed to run tailscale up: %s", tsc.Hostname(), err)
				}

				body, err := doLoginURL(tsc.Hostname(), loginURL)
				if err != nil {
					return err
				}

				// If the URL is not a OIDC URL, then we need to
				// run the register command to fully log in the client.
				if !strings.Contains(loginURL.String(), "/oidc/") {
					s.runHeadscaleRegister(userStr, body)
				}

				return nil
			})

			log.Printf("client %s is ready", client.Hostname())
		}

		if err := user.joinWaitGroup.Wait(); err != nil {
			return err
		}

		for _, client := range user.Clients {
			err := client.WaitForRunning()
			if err != nil {
				return fmt.Errorf(
					"%s tailscale node has not reached running: %w",
					client.Hostname(),
					err,
				)
			}
		}

		return nil
	}

	return fmt.Errorf("failed to up tailscale node: %w", errNoUserAvailable)
}

// doLoginURL visits the given login URL and returns the body as a
// string.
func doLoginURL(hostname string, loginURL *url.URL) (string, error) {
	log.Printf("%s login url: %s\n", hostname, loginURL.String())

	var err error
	hc := &http.Client{
		Transport: LoggingRoundTripper{},
	}
	hc.Jar, err = cookiejar.New(nil)
	if err != nil {
		return "", fmt.Errorf("%s failed to create cookiejar	: %w", hostname, err)
	}

	log.Printf("%s logging in with url", hostname)
	ctx := context.Background()
	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, loginURL.String(), nil)
	resp, err := hc.Do(req)
	if err != nil {
		return "", fmt.Errorf("%s failed to send http request: %w", hostname, err)
	}

	log.Printf("cookies: %+v", hc.Jar.Cookies(loginURL))

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("body: %s", body)

		return "", fmt.Errorf("%s response code of login request was %w", hostname, err)
	}

	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("%s failed to read response body: %s", hostname, err)

		return "", fmt.Errorf("%s failed to read response body: %w", hostname, err)
	}

	return string(body), nil
}

var errParseAuthPage = errors.New("failed to parse auth page")

func (s *Scenario) runHeadscaleRegister(userStr string, body string) error {
	// see api.go HTML template
	codeSep := strings.Split(string(body), "</code>")
	if len(codeSep) != 2 {
		return errParseAuthPage
	}

	keySep := strings.Split(codeSep[0], "key ")
	if len(keySep) != 2 {
		return errParseAuthPage
	}
	key := keySep[1]
	key = strings.SplitN(key, " ", 2)[0]
	log.Printf("registering node %s", key)

	if headscale, err := s.Headscale(); err == nil {
		_, err = headscale.Execute(
			[]string{"headscale", "nodes", "register", "--user", userStr, "--key", key},
		)
		if err != nil {
			log.Printf("failed to register node: %s", err)

			return err
		}

		return nil
	}

	return fmt.Errorf("failed to find headscale: %w", errNoHeadscaleAvailable)
}

type LoggingRoundTripper struct{}

func (t LoggingRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	noTls := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true}, // nolint
	}
	resp, err := noTls.RoundTrip(req)
	if err != nil {
		return nil, err
	}

	log.Printf("---")
	log.Printf("method: %s | url: %s", resp.Request.Method, resp.Request.URL.String())
	log.Printf("status: %d | cookies: %+v", resp.StatusCode, resp.Cookies())

	return resp, nil
}

// GetIPs returns all netip.Addr of TailscaleClients associated with a User
// in a Scenario.
func (s *Scenario) GetIPs(user string) ([]netip.Addr, error) {
	var ips []netip.Addr
	if ns, ok := s.users[user]; ok {
		for _, client := range ns.Clients {
			clientIps, err := client.IPs()
			if err != nil {
				return ips, fmt.Errorf("failed to get ips: %w", err)
			}
			ips = append(ips, clientIps...)
		}

		return ips, nil
	}

	return ips, fmt.Errorf("failed to get ips: %w", errNoUserAvailable)
}

// GetClients returns all TailscaleClients associated with a User in a Scenario.
func (s *Scenario) GetClients(user string) ([]TailscaleClient, error) {
	var clients []TailscaleClient
	if ns, ok := s.users[user]; ok {
		for _, client := range ns.Clients {
			clients = append(clients, client)
		}

		return clients, nil
	}

	return clients, fmt.Errorf("failed to get clients: %w", errNoUserAvailable)
}

// ListTailscaleClients returns a list of TailscaleClients given the Users
// passed as parameters.
func (s *Scenario) ListTailscaleClients(users ...string) ([]TailscaleClient, error) {
	var allClients []TailscaleClient

	if len(users) == 0 {
		users = s.Users()
	}

	for _, user := range users {
		clients, err := s.GetClients(user)
		if err != nil {
			return nil, err
		}

		allClients = append(allClients, clients...)
	}

	return allClients, nil
}

// FindTailscaleClientByIP returns a TailscaleClient associated with an IP address
// if it exists.
func (s *Scenario) FindTailscaleClientByIP(ip netip.Addr) (TailscaleClient, error) {
	clients, err := s.ListTailscaleClients()
	if err != nil {
		return nil, err
	}

	for _, client := range clients {
		ips, _ := client.IPs()
		for _, ip2 := range ips {
			if ip == ip2 {
				return client, nil
			}
		}
	}

	return nil, errNoClientFound
}

// ListTailscaleClientsIPs returns a list of netip.Addr based on Users
// passed as parameters.
func (s *Scenario) ListTailscaleClientsIPs(users ...string) ([]netip.Addr, error) {
	var allIps []netip.Addr

	if len(users) == 0 {
		users = s.Users()
	}

	for _, user := range users {
		ips, err := s.GetIPs(user)
		if err != nil {
			return nil, err
		}

		allIps = append(allIps, ips...)
	}

	return allIps, nil
}

// ListTailscaleClientsFQDNs returns a list of FQDN based on Users
// passed as parameters.
func (s *Scenario) ListTailscaleClientsFQDNs(users ...string) ([]string, error) {
	allFQDNs := make([]string, 0)

	clients, err := s.ListTailscaleClients(users...)
	if err != nil {
		return nil, err
	}

	for _, client := range clients {
		fqdn, err := client.FQDN()
		if err != nil {
			return nil, err
		}

		allFQDNs = append(allFQDNs, fqdn)
	}

	return allFQDNs, nil
}

// WaitForTailscaleLogout blocks execution until all TailscaleClients have
// logged out of the ControlServer.
func (s *Scenario) WaitForTailscaleLogout() error {
	for _, user := range s.users {
		for _, client := range user.Clients {
			c := client
			user.syncWaitGroup.Go(func() error {
				return c.WaitForNeedsLogin()
			})
		}
		if err := user.syncWaitGroup.Wait(); err != nil {
			return err
		}
	}

	return nil
}

// CreateDERPServer creates a new DERP server in a container.
func (s *Scenario) CreateDERPServer(version string, opts ...dsic.Option) (*dsic.DERPServerInContainer, error) {
	derp, err := dsic.New(s.pool, version, s.Networks(), opts...)
	if err != nil {
		return nil, fmt.Errorf("failed to create DERP server: %w", err)
	}

	err = derp.WaitForRunning()
	if err != nil {
		return nil, fmt.Errorf("failed to reach DERP server: %w", err)
	}

	s.derpServers = append(s.derpServers, derp)

	return derp, nil
}

type scenarioOIDC struct {
	r   *dockertest.Resource
	cfg *types.OIDCConfig
}

func (o *scenarioOIDC) Issuer() string {
	if o.cfg == nil {
		panic("OIDC has not been created")
	}

	return o.cfg.Issuer
}

func (o *scenarioOIDC) ClientSecret() string {
	if o.cfg == nil {
		panic("OIDC has not been created")
	}

	return o.cfg.ClientSecret
}

func (o *scenarioOIDC) ClientID() string {
	if o.cfg == nil {
		panic("OIDC has not been created")
	}

	return o.cfg.ClientID
}

const (
	dockerContextPath      = "../."
	hsicOIDCMockHashLength = 6
	defaultAccessTTL       = 10 * time.Minute
)

var errStatusCodeNotOK = errors.New("status code not OK")

func (s *Scenario) runMockOIDC(accessTTL time.Duration, users []mockoidc.MockUser) error {
	port, err := dockertestutil.RandomFreeHostPort()
	if err != nil {
		log.Fatalf("could not find an open port: %s", err)
	}
	portNotation := fmt.Sprintf("%d/tcp", port)

	hash, _ := util.GenerateRandomStringDNSSafe(hsicOIDCMockHashLength)

	hostname := "hs-oidcmock-" + hash

	usersJSON, err := json.Marshal(users)
	if err != nil {
		return err
	}

	mockOidcOptions := &dockertest.RunOptions{
		Name:         hostname,
		Cmd:          []string{"headscale", "mockoidc"},
		ExposedPorts: []string{portNotation},
		PortBindings: map[docker.Port][]docker.PortBinding{
			docker.Port(portNotation): {{HostPort: strconv.Itoa(port)}},
		},
		Networks: s.Networks(),
		Env: []string{
			"MOCKOIDC_ADDR=" + hostname,
			fmt.Sprintf("MOCKOIDC_PORT=%d", port),
			"MOCKOIDC_CLIENT_ID=superclient",
			"MOCKOIDC_CLIENT_SECRET=supersecret",
			"MOCKOIDC_ACCESS_TTL=" + accessTTL.String(),
			"MOCKOIDC_USERS=" + string(usersJSON),
		},
	}

	headscaleBuildOptions := &dockertest.BuildOptions{
		Dockerfile: hsic.IntegrationTestDockerFileName,
		ContextDir: dockerContextPath,
	}

	err = s.pool.RemoveContainerByName(hostname)
	if err != nil {
		return err
	}

	s.mockOIDC = scenarioOIDC{}

	// Add integration test labels if running under hi tool
	dockertestutil.DockerAddIntegrationLabels(mockOidcOptions, "oidc")

	if pmockoidc, err := s.pool.BuildAndRunWithBuildOptions(
		headscaleBuildOptions,
		mockOidcOptions,
		dockertestutil.DockerRestartPolicy); err == nil {
		s.mockOIDC.r = pmockoidc
	} else {
		return err
	}

	// headscale needs to set up the provider with a specific
	// IP addr to ensure we get the correct config from the well-known
	// endpoint.
	network := s.Networks()[0]
	ipAddr := s.mockOIDC.r.GetIPInNetwork(network)

	log.Println("Waiting for headscale mock oidc to be ready for tests")
	hostEndpoint := net.JoinHostPort(ipAddr, strconv.Itoa(port))

	if err := s.pool.Retry(func() error {
		oidcConfigURL := fmt.Sprintf("http://%s/oidc/.well-known/openid-configuration", hostEndpoint)
		httpClient := &http.Client{}
		ctx := context.Background()
		req, _ := http.NewRequestWithContext(ctx, http.MethodGet, oidcConfigURL, nil)
		resp, err := httpClient.Do(req)
		if err != nil {
			log.Printf("headscale mock OIDC tests is not ready: %s\n", err)

			return err
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			return errStatusCodeNotOK
		}

		return nil
	}); err != nil {
		return err
	}

	s.mockOIDC.cfg = &types.OIDCConfig{
		Issuer: fmt.Sprintf(
			"http://%s/oidc",
			hostEndpoint,
		),
		ClientID:                   "superclient",
		ClientSecret:               "supersecret",
		OnlyStartIfOIDCIsAvailable: true,
	}

	log.Printf("headscale mock oidc is ready for tests at %s", hostEndpoint)

	return nil
}

type extraServiceFunc func(*Scenario, string) (*dockertest.Resource, error)

func Webservice(s *Scenario, networkName string) (*dockertest.Resource, error) {
	// port, err := dockertestutil.RandomFreeHostPort()
	// if err != nil {
	// 	log.Fatalf("could not find an open port: %s", err)
	// }
	// portNotation := fmt.Sprintf("%d/tcp", port)

	hash := util.MustGenerateRandomStringDNSSafe(hsicOIDCMockHashLength)

	hostname := "hs-webservice-" + hash

	network, ok := s.networks[s.prefixedNetworkName(networkName)]
	if !ok {
		return nil, fmt.Errorf("network does not exist: %s", networkName)
	}

	webOpts := &dockertest.RunOptions{
		Name: hostname,
		Cmd:  []string{"/bin/sh", "-c", "cd / ; python3 -m http.server --bind :: 80"},
		// ExposedPorts: []string{portNotation},
		// PortBindings: map[docker.Port][]docker.PortBinding{
		// 	docker.Port(portNotation): {{HostPort: strconv.Itoa(port)}},
		// },
		Networks: []*dockertest.Network{network},
		Env:      []string{},
	}

	// Add integration test labels if running under hi tool
	dockertestutil.DockerAddIntegrationLabels(webOpts, "web")

	webBOpts := &dockertest.BuildOptions{
		Dockerfile: hsic.IntegrationTestDockerFileName,
		ContextDir: dockerContextPath,
	}

	web, err := s.pool.BuildAndRunWithBuildOptions(
		webBOpts,
		webOpts,
		dockertestutil.DockerRestartPolicy)
	if err != nil {
		return nil, err
	}

	// headscale needs to set up the provider with a specific
	// IP addr to ensure we get the correct config from the well-known
	// endpoint.
	// ipAddr := web.GetIPInNetwork(network)

	// log.Println("Waiting for headscale mock oidc to be ready for tests")
	// hostEndpoint := net.JoinHostPort(ipAddr, strconv.Itoa(port))

	// if err := s.pool.Retry(func() error {
	// 	oidcConfigURL := fmt.Sprintf("http://%s/etc/hostname", hostEndpoint)
	// 	httpClient := &http.Client{}
	// 	ctx := context.Background()
	// 	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, oidcConfigURL, nil)
	// 	resp, err := httpClient.Do(req)
	// 	if err != nil {
	// 		log.Printf("headscale mock OIDC tests is not ready: %s\n", err)

	// 		return err
	// 	}
	// 	defer resp.Body.Close()

	// 	if resp.StatusCode != http.StatusOK {
	// 		return errStatusCodeNotOK
	// 	}

	// 	return nil
	// }); err != nil {
	// 	return err
	// }

	return web, nil
}
