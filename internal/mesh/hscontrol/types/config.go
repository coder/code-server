package types

import (
	"errors"
	"fmt"
	"io/fs"
	"net/netip"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/juanfont/headscale/hscontrol/util"
	"github.com/prometheus/common/model"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
	"go4.org/netipx"
	"tailscale.com/net/tsaddr"
	"tailscale.com/tailcfg"
	"tailscale.com/types/dnstype"
	"tailscale.com/util/set"
)

const (
	defaultOIDCExpiryTime               = 180 * 24 * time.Hour // 180 Days
	maxDuration           time.Duration = 1<<63 - 1
	PKCEMethodPlain       string        = "plain"
	PKCEMethodS256        string        = "S256"
)

var (
	errOidcMutuallyExclusive = errors.New("oidc_client_secret and oidc_client_secret_path are mutually exclusive")
	errServerURLSuffix       = errors.New("server_url cannot be part of base_domain in a way that could make the DERP and headscale server unreachable")
	errServerURLSame         = errors.New("server_url cannot use the same domain as base_domain in a way that could make the DERP and headscale server unreachable")
	errInvalidPKCEMethod     = errors.New("pkce.method must be either 'plain' or 'S256'")
)

type IPAllocationStrategy string

const (
	IPAllocationStrategySequential IPAllocationStrategy = "sequential"
	IPAllocationStrategyRandom     IPAllocationStrategy = "random"
)

type PolicyMode string

const (
	PolicyModeDB   = "database"
	PolicyModeFile = "file"
)

// Config contains the initial Headscale configuration.
type Config struct {
	ServerURL                      string
	Addr                           string
	MetricsAddr                    string
	GRPCAddr                       string
	GRPCAllowInsecure              bool
	EphemeralNodeInactivityTimeout time.Duration
	PrefixV4                       *netip.Prefix
	PrefixV6                       *netip.Prefix
	IPAllocation                   IPAllocationStrategy
	NoisePrivateKeyPath            string
	BaseDomain                     string
	Log                            LogConfig
	DisableUpdateCheck             bool

	Database DatabaseConfig

	DERP DERPConfig

	TLS TLSConfig

	ACMEURL   string
	ACMEEmail string

	// DNSConfig is the headscale representation of the DNS configuration.
	// It is kept in the config update for some settings that are
	// not directly converted into a tailcfg.DNSConfig.
	DNSConfig DNSConfig

	// TailcfgDNSConfig is the tailcfg representation of the DNS configuration,
	// it can be used directly when sending Netmaps to clients.
	TailcfgDNSConfig *tailcfg.DNSConfig

	UnixSocket           string
	UnixSocketPermission fs.FileMode

	OIDC OIDCConfig

	LogTail             LogTailConfig
	RandomizeClientPort bool

	CLI CLIConfig

	Policy PolicyConfig

	Tuning Tuning
}

type DNSConfig struct {
	MagicDNS         bool   `mapstructure:"magic_dns"`
	BaseDomain       string `mapstructure:"base_domain"`
	OverrideLocalDNS bool   `mapstructure:"override_local_dns"`
	Nameservers      Nameservers
	SearchDomains    []string            `mapstructure:"search_domains"`
	ExtraRecords     []tailcfg.DNSRecord `mapstructure:"extra_records"`
	ExtraRecordsPath string              `mapstructure:"extra_records_path"`
}

type Nameservers struct {
	Global []string
	Split  map[string][]string
}

type SqliteConfig struct {
	Path              string
	WriteAheadLog     bool
	WALAutoCheckPoint int
}

type PostgresConfig struct {
	Host                string
	Port                int
	Name                string
	User                string
	Pass                string
	Ssl                 string
	MaxOpenConnections  int
	MaxIdleConnections  int
	ConnMaxIdleTimeSecs int
}

type GormConfig struct {
	Debug                 bool
	SlowThreshold         time.Duration
	SkipErrRecordNotFound bool
	ParameterizedQueries  bool
	PrepareStmt           bool
}

type DatabaseConfig struct {
	// Type sets the database type, either "sqlite3" or "postgres"
	Type  string
	Debug bool

	// Type sets the gorm configuration
	Gorm GormConfig

	Sqlite   SqliteConfig
	Postgres PostgresConfig
}

type TLSConfig struct {
	CertPath string
	KeyPath  string

	LetsEncrypt LetsEncryptConfig
}

type LetsEncryptConfig struct {
	Listen        string
	Hostname      string
	CacheDir      string
	ChallengeType string
}

type PKCEConfig struct {
	Enabled bool
	Method  string
}

type OIDCConfig struct {
	OnlyStartIfOIDCIsAvailable bool
	Issuer                     string
	ClientID                   string
	ClientSecret               string
	Scope                      []string
	ExtraParams                map[string]string
	AllowedDomains             []string
	AllowedUsers               []string
	AllowedGroups              []string
	Expiry                     time.Duration
	UseExpiryFromToken         bool
	PKCE                       PKCEConfig
}

type DERPConfig struct {
	ServerEnabled                      bool
	AutomaticallyAddEmbeddedDerpRegion bool
	ServerRegionID                     int
	ServerRegionCode                   string
	ServerRegionName                   string
	ServerPrivateKeyPath               string
	ServerVerifyClients                bool
	STUNAddr                           string
	URLs                               []url.URL
	Paths                              []string
	DERPMap                            *tailcfg.DERPMap
	AutoUpdate                         bool
	UpdateFrequency                    time.Duration
	IPv4                               string
	IPv6                               string
}

type LogTailConfig struct {
	Enabled bool
}

type CLIConfig struct {
	Address  string
	APIKey   string
	Timeout  time.Duration
	Insecure bool
}

type PolicyConfig struct {
	Path string
	Mode PolicyMode
}

func (p *PolicyConfig) IsEmpty() bool {
	return p.Mode == PolicyModeFile && p.Path == ""
}

type LogConfig struct {
	Format string
	Level  zerolog.Level
}

type Tuning struct {
	NotifierSendTimeout            time.Duration
	BatchChangeDelay               time.Duration
	NodeMapSessionBufferedChanSize int
}

func validatePKCEMethod(method string) error {
	if method != PKCEMethodPlain && method != PKCEMethodS256 {
		return errInvalidPKCEMethod
	}
	return nil
}

// Domain returns the hostname/domain part of the ServerURL.
// If the ServerURL is not a valid URL, it returns the BaseDomain.
func (c *Config) Domain() string {
	u, err := url.Parse(c.ServerURL)
	if err != nil {
		return c.BaseDomain
	}

	return u.Hostname()
}

// LoadConfig prepares and loads the Headscale configuration into Viper.
// This means it sets the default values, reads the configuration file and
// environment variables, and handles deprecated configuration options.
// It has to be called before LoadServerConfig and LoadCLIConfig.
// The configuration is not validated and the caller should check for errors
// using a validation function.
func LoadConfig(path string, isFile bool) error {
	if isFile {
		viper.SetConfigFile(path)
	} else {
		viper.SetConfigName("config")
		if path == "" {
			viper.AddConfigPath("/etc/headscale/")
			viper.AddConfigPath("$HOME/.headscale")
			viper.AddConfigPath(".")
		} else {
			// For testing
			viper.AddConfigPath(path)
		}
	}

	envPrefix := "headscale"
	viper.SetEnvPrefix(envPrefix)
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()

	viper.SetDefault("policy.mode", "file")

	viper.SetDefault("tls_letsencrypt_cache_dir", "/var/www/.cache")
	viper.SetDefault("tls_letsencrypt_challenge_type", HTTP01ChallengeType)

	viper.SetDefault("log.level", "info")
	viper.SetDefault("log.format", TextLogFormat)

	viper.SetDefault("dns.magic_dns", true)
	viper.SetDefault("dns.base_domain", "")
	viper.SetDefault("dns.override_local_dns", true)
	viper.SetDefault("dns.nameservers.global", []string{})
	viper.SetDefault("dns.nameservers.split", map[string]string{})
	viper.SetDefault("dns.search_domains", []string{})

	viper.SetDefault("derp.server.enabled", false)
	viper.SetDefault("derp.server.stun.enabled", true)
	viper.SetDefault("derp.server.automatically_add_embedded_derp_region", true)

	viper.SetDefault("unix_socket", "/var/run/headscale/headscale.sock")
	viper.SetDefault("unix_socket_permission", "0o770")

	viper.SetDefault("grpc_listen_addr", ":50443")
	viper.SetDefault("grpc_allow_insecure", false)

	viper.SetDefault("cli.timeout", "5s")
	viper.SetDefault("cli.insecure", false)

	viper.SetDefault("database.postgres.ssl", false)
	viper.SetDefault("database.postgres.max_open_conns", 10)
	viper.SetDefault("database.postgres.max_idle_conns", 10)
	viper.SetDefault("database.postgres.conn_max_idle_time_secs", 3600)

	viper.SetDefault("database.sqlite.write_ahead_log", true)
	viper.SetDefault("database.sqlite.wal_autocheckpoint", 1000) // SQLite default

	viper.SetDefault("oidc.scope", []string{oidc.ScopeOpenID, "profile", "email"})
	viper.SetDefault("oidc.only_start_if_oidc_is_available", true)
	viper.SetDefault("oidc.expiry", "180d")
	viper.SetDefault("oidc.use_expiry_from_token", false)
	viper.SetDefault("oidc.pkce.enabled", false)
	viper.SetDefault("oidc.pkce.method", "S256")

	viper.SetDefault("logtail.enabled", false)
	viper.SetDefault("randomize_client_port", false)

	viper.SetDefault("ephemeral_node_inactivity_timeout", "120s")

	viper.SetDefault("tuning.notifier_send_timeout", "800ms")
	viper.SetDefault("tuning.batch_change_delay", "800ms")
	viper.SetDefault("tuning.node_mapsession_buffered_chan_size", 30)

	viper.SetDefault("prefixes.allocation", string(IPAllocationStrategySequential))

	if err := viper.ReadInConfig(); err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			log.Warn().Msg("No config file found, using defaults")
			return nil
		}

		return fmt.Errorf("fatal error reading config file: %w", err)
	}

	return nil
}

func validateServerConfig() error {
	depr := deprecator{
		warns:  make(set.Set[string]),
		fatals: make(set.Set[string]),
	}

	// Register aliases for backward compatibility
	// Has to be called _after_ viper.ReadInConfig()
	// https://github.com/spf13/viper/issues/560

	// Alias the old ACL Policy path with the new configuration option.
	depr.fatalIfNewKeyIsNotUsed("policy.path", "acl_policy_path")

	// Move dns_config -> dns
	depr.fatalIfNewKeyIsNotUsed("dns.magic_dns", "dns_config.magic_dns")
	depr.fatalIfNewKeyIsNotUsed("dns.base_domain", "dns_config.base_domain")
	depr.fatalIfNewKeyIsNotUsed("dns.override_local_dns", "dns_config.override_local_dns")
	depr.fatalIfNewKeyIsNotUsed("dns.nameservers.global", "dns_config.nameservers")
	depr.fatalIfNewKeyIsNotUsed("dns.nameservers.split", "dns_config.restricted_nameservers")
	depr.fatalIfNewKeyIsNotUsed("dns.search_domains", "dns_config.domains")
	depr.fatalIfNewKeyIsNotUsed("dns.extra_records", "dns_config.extra_records")
	depr.fatal("dns.use_username_in_magic_dns")
	depr.fatal("dns_config.use_username_in_magic_dns")

	// Removed since version v0.26.0
	depr.fatal("oidc.strip_email_domain")
	depr.fatal("oidc.map_legacy_users")

	if viper.GetBool("oidc.enabled") {
		if err := validatePKCEMethod(viper.GetString("oidc.pkce.method")); err != nil {
			return err
		}
	}

	depr.Log()

	if viper.IsSet("dns.extra_records") && viper.IsSet("dns.extra_records_path") {
		log.Fatal().Msg("Fatal config error: dns.extra_records and dns.extra_records_path are mutually exclusive. Please remove one of them from your config file")
	}

	// Collect any validation errors and return them all at once
	var errorText string
	if (viper.GetString("tls_letsencrypt_hostname") != "") &&
		((viper.GetString("tls_cert_path") != "") || (viper.GetString("tls_key_path") != "")) {
		errorText += "Fatal config error: set either tls_letsencrypt_hostname or tls_cert_path/tls_key_path, not both\n"
	}

	if viper.GetString("noise.private_key_path") == "" {
		errorText += "Fatal config error: headscale now requires a new `noise.private_key_path` field in the config file for the Tailscale v2 protocol\n"
	}

	if (viper.GetString("tls_letsencrypt_hostname") != "") &&
		(viper.GetString("tls_letsencrypt_challenge_type") == TLSALPN01ChallengeType) &&
		(!strings.HasSuffix(viper.GetString("listen_addr"), ":443")) {
		// this is only a warning because there could be something sitting in front of headscale that redirects the traffic (e.g. an iptables rule)
		log.Warn().
			Msg("Warning: when using tls_letsencrypt_hostname with TLS-ALPN-01 as challenge type, headscale must be reachable on port 443, i.e. listen_addr should probably end in :443")
	}

	if (viper.GetString("tls_letsencrypt_challenge_type") != HTTP01ChallengeType) &&
		(viper.GetString("tls_letsencrypt_challenge_type") != TLSALPN01ChallengeType) {
		errorText += "Fatal config error: the only supported values for tls_letsencrypt_challenge_type are HTTP-01 and TLS-ALPN-01\n"
	}

	if !strings.HasPrefix(viper.GetString("server_url"), "http://") &&
		!strings.HasPrefix(viper.GetString("server_url"), "https://") {
		errorText += "Fatal config error: server_url must start with https:// or http://\n"
	}

	// Minimum inactivity time out is keepalive timeout (60s) plus a few seconds
	// to avoid races
	minInactivityTimeout, _ := time.ParseDuration("65s")
	if viper.GetDuration("ephemeral_node_inactivity_timeout") <= minInactivityTimeout {
		errorText += fmt.Sprintf(
			"Fatal config error: ephemeral_node_inactivity_timeout (%s) is set too low, must be more than %s",
			viper.GetString("ephemeral_node_inactivity_timeout"),
			minInactivityTimeout,
		)
	}

	if viper.GetBool("dns.override_local_dns") {
		if global := viper.GetStringSlice("dns.nameservers.global"); len(global) == 0 {
			errorText += "Fatal config error: dns.nameservers.global must be set when dns.override_local_dns is true\n"
		}
	}

	if errorText != "" {
		// nolint
		return errors.New(strings.TrimSuffix(errorText, "\n"))
	}

	return nil
}

func tlsConfig() TLSConfig {
	return TLSConfig{
		LetsEncrypt: LetsEncryptConfig{
			Hostname: viper.GetString("tls_letsencrypt_hostname"),
			Listen:   viper.GetString("tls_letsencrypt_listen"),
			CacheDir: util.AbsolutePathFromConfigPath(
				viper.GetString("tls_letsencrypt_cache_dir"),
			),
			ChallengeType: viper.GetString("tls_letsencrypt_challenge_type"),
		},
		CertPath: util.AbsolutePathFromConfigPath(
			viper.GetString("tls_cert_path"),
		),
		KeyPath: util.AbsolutePathFromConfigPath(
			viper.GetString("tls_key_path"),
		),
	}
}

func derpConfig() DERPConfig {
	serverEnabled := viper.GetBool("derp.server.enabled")
	serverRegionID := viper.GetInt("derp.server.region_id")
	serverRegionCode := viper.GetString("derp.server.region_code")
	serverRegionName := viper.GetString("derp.server.region_name")
	serverVerifyClients := viper.GetBool("derp.server.verify_clients")
	stunAddr := viper.GetString("derp.server.stun_listen_addr")
	privateKeyPath := util.AbsolutePathFromConfigPath(
		viper.GetString("derp.server.private_key_path"),
	)
	ipv4 := viper.GetString("derp.server.ipv4")
	ipv6 := viper.GetString("derp.server.ipv6")
	automaticallyAddEmbeddedDerpRegion := viper.GetBool(
		"derp.server.automatically_add_embedded_derp_region",
	)
	if serverEnabled && stunAddr == "" {
		log.Fatal().
			Msg("derp.server.stun_listen_addr must be set if derp.server.enabled is true")
	}

	urlStrs := viper.GetStringSlice("derp.urls")

	urls := make([]url.URL, len(urlStrs))
	for index, urlStr := range urlStrs {
		urlAddr, err := url.Parse(urlStr)
		if err != nil {
			log.Error().
				Str("url", urlStr).
				Err(err).
				Msg("Failed to parse url, ignoring...")
		}

		urls[index] = *urlAddr
	}

	paths := viper.GetStringSlice("derp.paths")

	if serverEnabled && !automaticallyAddEmbeddedDerpRegion && len(paths) == 0 {
		log.Fatal().
			Msg("Disabling derp.server.automatically_add_embedded_derp_region requires to configure the derp server in derp.paths")
	}

	autoUpdate := viper.GetBool("derp.auto_update_enabled")
	updateFrequency := viper.GetDuration("derp.update_frequency")

	return DERPConfig{
		ServerEnabled:                      serverEnabled,
		ServerRegionID:                     serverRegionID,
		ServerRegionCode:                   serverRegionCode,
		ServerRegionName:                   serverRegionName,
		ServerVerifyClients:                serverVerifyClients,
		ServerPrivateKeyPath:               privateKeyPath,
		STUNAddr:                           stunAddr,
		URLs:                               urls,
		Paths:                              paths,
		AutoUpdate:                         autoUpdate,
		UpdateFrequency:                    updateFrequency,
		IPv4:                               ipv4,
		IPv6:                               ipv6,
		AutomaticallyAddEmbeddedDerpRegion: automaticallyAddEmbeddedDerpRegion,
	}
}

func logtailConfig() LogTailConfig {
	enabled := viper.GetBool("logtail.enabled")

	return LogTailConfig{
		Enabled: enabled,
	}
}

func policyConfig() PolicyConfig {
	policyPath := viper.GetString("policy.path")
	policyMode := viper.GetString("policy.mode")

	return PolicyConfig{
		Path: policyPath,
		Mode: PolicyMode(policyMode),
	}
}

func logConfig() LogConfig {
	logLevelStr := viper.GetString("log.level")
	logLevel, err := zerolog.ParseLevel(logLevelStr)
	if err != nil {
		logLevel = zerolog.DebugLevel
	}

	logFormatOpt := viper.GetString("log.format")
	var logFormat string
	switch logFormatOpt {
	case JSONLogFormat:
		logFormat = JSONLogFormat
	case TextLogFormat:
		logFormat = TextLogFormat
	case "":
		logFormat = TextLogFormat
	default:
		log.Error().
			Str("func", "GetLogConfig").
			Msgf("Could not parse log format: %s. Valid choices are 'json' or 'text'", logFormatOpt)
	}

	return LogConfig{
		Format: logFormat,
		Level:  logLevel,
	}
}

func databaseConfig() DatabaseConfig {
	debug := viper.GetBool("database.debug")

	type_ := viper.GetString("database.type")

	skipErrRecordNotFound := viper.GetBool("database.gorm.skip_err_record_not_found")
	slowThreshold := viper.GetDuration("database.gorm.slow_threshold") * time.Millisecond
	parameterizedQueries := viper.GetBool("database.gorm.parameterized_queries")
	prepareStmt := viper.GetBool("database.gorm.prepare_stmt")

	switch type_ {
	case DatabaseSqlite, DatabasePostgres:
		break
	case "sqlite":
		type_ = "sqlite3"
	default:
		log.Fatal().
			Msgf("invalid database type %q, must be sqlite, sqlite3 or postgres", type_)
	}

	return DatabaseConfig{
		Type:  type_,
		Debug: debug,
		Gorm: GormConfig{
			Debug:                 debug,
			SkipErrRecordNotFound: skipErrRecordNotFound,
			SlowThreshold:         slowThreshold,
			ParameterizedQueries:  parameterizedQueries,
			PrepareStmt:           prepareStmt,
		},
		Sqlite: SqliteConfig{
			Path: util.AbsolutePathFromConfigPath(
				viper.GetString("database.sqlite.path"),
			),
			WriteAheadLog:     viper.GetBool("database.sqlite.write_ahead_log"),
			WALAutoCheckPoint: viper.GetInt("database.sqlite.wal_autocheckpoint"),
		},
		Postgres: PostgresConfig{
			Host:               viper.GetString("database.postgres.host"),
			Port:               viper.GetInt("database.postgres.port"),
			Name:               viper.GetString("database.postgres.name"),
			User:               viper.GetString("database.postgres.user"),
			Pass:               viper.GetString("database.postgres.pass"),
			Ssl:                viper.GetString("database.postgres.ssl"),
			MaxOpenConnections: viper.GetInt("database.postgres.max_open_conns"),
			MaxIdleConnections: viper.GetInt("database.postgres.max_idle_conns"),
			ConnMaxIdleTimeSecs: viper.GetInt(
				"database.postgres.conn_max_idle_time_secs",
			),
		},
	}
}

func dns() (DNSConfig, error) {
	var dns DNSConfig

	// TODO: Use this instead of manually getting settings when
	// UnmarshalKey is compatible with Environment Variables.
	// err := viper.UnmarshalKey("dns", &dns)
	// if err != nil {
	// 	return DNSConfig{}, fmt.Errorf("unmarshalling dns config: %w", err)
	// }

	dns.MagicDNS = viper.GetBool("dns.magic_dns")
	dns.BaseDomain = viper.GetString("dns.base_domain")
	dns.OverrideLocalDNS = viper.GetBool("dns.override_local_dns")
	dns.Nameservers.Global = viper.GetStringSlice("dns.nameservers.global")
	dns.Nameservers.Split = viper.GetStringMapStringSlice("dns.nameservers.split")
	dns.SearchDomains = viper.GetStringSlice("dns.search_domains")
	dns.ExtraRecordsPath = viper.GetString("dns.extra_records_path")

	if viper.IsSet("dns.extra_records") {
		var extraRecords []tailcfg.DNSRecord

		err := viper.UnmarshalKey("dns.extra_records", &extraRecords)
		if err != nil {
			return DNSConfig{}, fmt.Errorf("unmarshalling dns extra records: %w", err)
		}
		dns.ExtraRecords = extraRecords
	}

	return dns, nil
}

// globalResolvers returns the global DNS resolvers
// defined in the config file.
// If a nameserver is a valid IP, it will be used as a regular resolver.
// If a nameserver is a valid URL, it will be used as a DoH resolver.
// If a nameserver is neither a valid URL nor a valid IP, it will be ignored.
func (d *DNSConfig) globalResolvers() []*dnstype.Resolver {
	var resolvers []*dnstype.Resolver

	for _, nsStr := range d.Nameservers.Global {
		warn := ""
		if _, err := netip.ParseAddr(nsStr); err == nil {
			resolvers = append(resolvers, &dnstype.Resolver{
				Addr: nsStr,
			})

			continue
		} else {
			warn = fmt.Sprintf("Invalid global nameserver %q. Parsing error: %s ignoring", nsStr, err)
		}

		if _, err := url.Parse(nsStr); err == nil {
			resolvers = append(resolvers, &dnstype.Resolver{
				Addr: nsStr,
			})

			continue
		} else {
			warn = fmt.Sprintf("Invalid global nameserver %q. Parsing error: %s ignoring", nsStr, err)
		}

		if warn != "" {
			log.Warn().Msg(warn)
		}
	}

	return resolvers
}

// splitResolvers returns a map of domain to DNS resolvers.
// If a nameserver is a valid IP, it will be used as a regular resolver.
// If a nameserver is a valid URL, it will be used as a DoH resolver.
// If a nameserver is neither a valid URL nor a valid IP, it will be ignored.
func (d *DNSConfig) splitResolvers() map[string][]*dnstype.Resolver {
	routes := make(map[string][]*dnstype.Resolver)
	for domain, nameservers := range d.Nameservers.Split {
		var resolvers []*dnstype.Resolver
		for _, nsStr := range nameservers {
			warn := ""
			if _, err := netip.ParseAddr(nsStr); err == nil {
				resolvers = append(resolvers, &dnstype.Resolver{
					Addr: nsStr,
				})

				continue
			} else {
				warn = fmt.Sprintf("Invalid split dns nameserver %q. Parsing error: %s ignoring", nsStr, err)
			}

			if _, err := url.Parse(nsStr); err == nil {
				resolvers = append(resolvers, &dnstype.Resolver{
					Addr: nsStr,
				})

				continue
			} else {
				warn = fmt.Sprintf("Invalid split dns nameserver %q. Parsing error: %s ignoring", nsStr, err)
			}

			if warn != "" {
				log.Warn().Msg(warn)
			}
		}
		routes[domain] = resolvers
	}

	return routes
}

func dnsToTailcfgDNS(dns DNSConfig) *tailcfg.DNSConfig {
	cfg := tailcfg.DNSConfig{}

	if dns.BaseDomain == "" && dns.MagicDNS {
		log.Fatal().Msg("dns.base_domain must be set when using MagicDNS (dns.magic_dns)")
	}

	cfg.Proxied = dns.MagicDNS
	cfg.ExtraRecords = dns.ExtraRecords
	if dns.OverrideLocalDNS {
		cfg.Resolvers = dns.globalResolvers()
	} else {
		cfg.FallbackResolvers = dns.globalResolvers()
	}

	routes := dns.splitResolvers()
	cfg.Routes = routes
	if dns.BaseDomain != "" {
		cfg.Domains = []string{dns.BaseDomain}
	}
	cfg.Domains = append(cfg.Domains, dns.SearchDomains...)

	return &cfg
}

func prefixV4() (*netip.Prefix, error) {
	prefixV4Str := viper.GetString("prefixes.v4")

	if prefixV4Str == "" {
		return nil, nil
	}

	prefixV4, err := netip.ParsePrefix(prefixV4Str)
	if err != nil {
		return nil, fmt.Errorf("parsing IPv4 prefix from config: %w", err)
	}

	builder := netipx.IPSetBuilder{}
	builder.AddPrefix(tsaddr.CGNATRange())
	ipSet, _ := builder.IPSet()
	if !ipSet.ContainsPrefix(prefixV4) {
		log.Warn().
			Msgf("Prefix %s is not in the %s range. This is an unsupported configuration.",
				prefixV4Str, tsaddr.CGNATRange())
	}

	return &prefixV4, nil
}

func prefixV6() (*netip.Prefix, error) {
	prefixV6Str := viper.GetString("prefixes.v6")

	if prefixV6Str == "" {
		return nil, nil
	}

	prefixV6, err := netip.ParsePrefix(prefixV6Str)
	if err != nil {
		return nil, fmt.Errorf("parsing IPv6 prefix from config: %w", err)
	}

	builder := netipx.IPSetBuilder{}
	builder.AddPrefix(tsaddr.TailscaleULARange())
	ipSet, _ := builder.IPSet()

	if !ipSet.ContainsPrefix(prefixV6) {
		log.Warn().
			Msgf("Prefix %s is not in the %s range. This is an unsupported configuration.",
				prefixV6Str, tsaddr.TailscaleULARange())
	}

	return &prefixV6, nil
}

// LoadCLIConfig returns the needed configuration for the CLI client
// of Headscale to connect to a Headscale server.
func LoadCLIConfig() (*Config, error) {
	logConfig := logConfig()
	zerolog.SetGlobalLevel(logConfig.Level)

	return &Config{
		DisableUpdateCheck: viper.GetBool("disable_check_updates"),
		UnixSocket:         viper.GetString("unix_socket"),
		CLI: CLIConfig{
			Address:  viper.GetString("cli.address"),
			APIKey:   viper.GetString("cli.api_key"),
			Timeout:  viper.GetDuration("cli.timeout"),
			Insecure: viper.GetBool("cli.insecure"),
		},
		Log: logConfig,
	}, nil
}

// LoadServerConfig returns the full Headscale configuration to
// host a Headscale server. This is called as part of `headscale serve`.
func LoadServerConfig() (*Config, error) {
	if err := validateServerConfig(); err != nil {
		return nil, err
	}

	logConfig := logConfig()
	zerolog.SetGlobalLevel(logConfig.Level)

	prefix4, err := prefixV4()
	if err != nil {
		return nil, err
	}

	prefix6, err := prefixV6()
	if err != nil {
		return nil, err
	}

	if prefix4 == nil && prefix6 == nil {
		return nil, errors.New("no IPv4 or IPv6 prefix configured, minimum one prefix is required")
	}

	allocStr := viper.GetString("prefixes.allocation")
	var alloc IPAllocationStrategy
	switch allocStr {
	case string(IPAllocationStrategySequential):
		alloc = IPAllocationStrategySequential
	case string(IPAllocationStrategyRandom):
		alloc = IPAllocationStrategyRandom
	default:
		return nil, fmt.Errorf(
			"config error, prefixes.allocation is set to %s, which is not a valid strategy, allowed options: %s, %s",
			allocStr,
			IPAllocationStrategySequential,
			IPAllocationStrategyRandom,
		)
	}

	dnsConfig, err := dns()
	if err != nil {
		return nil, err
	}

	derpConfig := derpConfig()
	logTailConfig := logtailConfig()
	randomizeClientPort := viper.GetBool("randomize_client_port")

	oidcClientSecret := viper.GetString("oidc.client_secret")
	oidcClientSecretPath := viper.GetString("oidc.client_secret_path")
	if oidcClientSecretPath != "" && oidcClientSecret != "" {
		return nil, errOidcMutuallyExclusive
	}
	if oidcClientSecretPath != "" {
		secretBytes, err := os.ReadFile(os.ExpandEnv(oidcClientSecretPath))
		if err != nil {
			return nil, err
		}
		oidcClientSecret = strings.TrimSpace(string(secretBytes))
	}

	serverURL := viper.GetString("server_url")

	// BaseDomain cannot be the same as the server URL.
	// This is because Tailscale takes over the domain in BaseDomain,
	// causing the headscale server and DERP to be unreachable.
	// For Tailscale upstream, the following is true:
	// - DERP run on their own domains
	// - Control plane runs on login.tailscale.com/controlplane.tailscale.com
	// - MagicDNS (BaseDomain) for users is on a *.ts.net domain per tailnet (e.g. tail-scale.ts.net)
	if dnsConfig.BaseDomain != "" {
		if err := isSafeServerURL(serverURL, dnsConfig.BaseDomain); err != nil {
			return nil, err
		}
	}

	return &Config{
		ServerURL:          serverURL,
		Addr:               viper.GetString("listen_addr"),
		MetricsAddr:        viper.GetString("metrics_listen_addr"),
		GRPCAddr:           viper.GetString("grpc_listen_addr"),
		GRPCAllowInsecure:  viper.GetBool("grpc_allow_insecure"),
		DisableUpdateCheck: false,

		PrefixV4:     prefix4,
		PrefixV6:     prefix6,
		IPAllocation: IPAllocationStrategy(alloc),

		NoisePrivateKeyPath: util.AbsolutePathFromConfigPath(
			viper.GetString("noise.private_key_path"),
		),
		BaseDomain: dnsConfig.BaseDomain,

		DERP: derpConfig,

		EphemeralNodeInactivityTimeout: viper.GetDuration(
			"ephemeral_node_inactivity_timeout",
		),

		Database: databaseConfig(),

		TLS: tlsConfig(),

		DNSConfig:        dnsConfig,
		TailcfgDNSConfig: dnsToTailcfgDNS(dnsConfig),

		ACMEEmail: viper.GetString("acme_email"),
		ACMEURL:   viper.GetString("acme_url"),

		UnixSocket:           viper.GetString("unix_socket"),
		UnixSocketPermission: util.GetFileMode("unix_socket_permission"),

		OIDC: OIDCConfig{
			OnlyStartIfOIDCIsAvailable: viper.GetBool(
				"oidc.only_start_if_oidc_is_available",
			),
			Issuer:         viper.GetString("oidc.issuer"),
			ClientID:       viper.GetString("oidc.client_id"),
			ClientSecret:   oidcClientSecret,
			Scope:          viper.GetStringSlice("oidc.scope"),
			ExtraParams:    viper.GetStringMapString("oidc.extra_params"),
			AllowedDomains: viper.GetStringSlice("oidc.allowed_domains"),
			AllowedUsers:   viper.GetStringSlice("oidc.allowed_users"),
			AllowedGroups:  viper.GetStringSlice("oidc.allowed_groups"),
			Expiry: func() time.Duration {
				// if set to 0, we assume no expiry
				if value := viper.GetString("oidc.expiry"); value == "0" {
					return maxDuration
				} else {
					expiry, err := model.ParseDuration(value)
					if err != nil {
						log.Warn().Msg("failed to parse oidc.expiry, defaulting back to 180 days")

						return defaultOIDCExpiryTime
					}

					return time.Duration(expiry)
				}
			}(),
			UseExpiryFromToken: viper.GetBool("oidc.use_expiry_from_token"),
			PKCE: PKCEConfig{
				Enabled: viper.GetBool("oidc.pkce.enabled"),
				Method:  viper.GetString("oidc.pkce.method"),
			},
		},

		LogTail:             logTailConfig,
		RandomizeClientPort: randomizeClientPort,

		Policy: policyConfig(),

		CLI: CLIConfig{
			Address:  viper.GetString("cli.address"),
			APIKey:   viper.GetString("cli.api_key"),
			Timeout:  viper.GetDuration("cli.timeout"),
			Insecure: viper.GetBool("cli.insecure"),
		},

		Log: logConfig,

		// TODO(kradalby): Document these settings when more stable
		Tuning: Tuning{
			NotifierSendTimeout: viper.GetDuration("tuning.notifier_send_timeout"),
			BatchChangeDelay:    viper.GetDuration("tuning.batch_change_delay"),
			NodeMapSessionBufferedChanSize: viper.GetInt(
				"tuning.node_mapsession_buffered_chan_size",
			),
		},
	}, nil
}

// BaseDomain cannot be a suffix of the server URL.
// This is because Tailscale takes over the domain in BaseDomain,
// causing the headscale server and DERP to be unreachable.
// For Tailscale upstream, the following is true:
// - DERP run on their own domains.
// - Control plane runs on login.tailscale.com/controlplane.tailscale.com.
// - MagicDNS (BaseDomain) for users is on a *.ts.net domain per tailnet (e.g. tail-scale.ts.net).
func isSafeServerURL(serverURL, baseDomain string) error {
	server, err := url.Parse(serverURL)
	if err != nil {
		return err
	}

	if server.Hostname() == baseDomain {
		return errServerURLSame
	}

	serverDomainParts := strings.Split(server.Host, ".")
	baseDomainParts := strings.Split(baseDomain, ".")

	if len(serverDomainParts) <= len(baseDomainParts) {
		return nil
	}

	s := len(serverDomainParts)
	b := len(baseDomainParts)
	for i := range baseDomainParts {
		if serverDomainParts[s-i-1] != baseDomainParts[b-i-1] {
			return nil
		}
	}

	return errServerURLSuffix
}

type deprecator struct {
	warns  set.Set[string]
	fatals set.Set[string]
}

// warnWithAlias will register an alias between the newKey and the oldKey,
// and log a deprecation warning if the oldKey is set.
func (d *deprecator) warnWithAlias(newKey, oldKey string) {
	// NOTE: RegisterAlias is called with NEW KEY -> OLD KEY
	viper.RegisterAlias(newKey, oldKey)
	if viper.IsSet(oldKey) {
		d.warns.Add(
			fmt.Sprintf(
				"The %q configuration key is deprecated. Please use %q instead. %q will be removed in the future.",
				oldKey,
				newKey,
				oldKey,
			),
		)
	}
}

// fatal deprecates and adds an entry to the fatal list of options if the oldKey is set.
func (d *deprecator) fatal(oldKey string) {
	if viper.IsSet(oldKey) {
		d.fatals.Add(
			fmt.Sprintf(
				"The %q configuration key has been removed. Please see the changelog for more details.",
				oldKey,
			),
		)
	}
}

// fatalIfNewKeyIsNotUsed deprecates and adds an entry to the fatal list of options if the oldKey is set and the new key is _not_ set.
// If the new key is set, a warning is emitted instead.
func (d *deprecator) fatalIfNewKeyIsNotUsed(newKey, oldKey string) {
	if viper.IsSet(oldKey) && !viper.IsSet(newKey) {
		d.fatals.Add(
			fmt.Sprintf(
				"The %q configuration key is deprecated. Please use %q instead. %q has been removed.",
				oldKey,
				newKey,
				oldKey,
			),
		)
	} else if viper.IsSet(oldKey) {
		d.warns.Add(fmt.Sprintf("The %q configuration key is deprecated. Please use %q instead. %q has been removed.", oldKey, newKey, oldKey))
	}
}

// warn deprecates and adds an option to log a warning if the oldKey is set.
func (d *deprecator) warnNoAlias(newKey, oldKey string) {
	if viper.IsSet(oldKey) {
		d.warns.Add(
			fmt.Sprintf(
				"The %q configuration key is deprecated. Please use %q instead. %q has been removed.",
				oldKey,
				newKey,
				oldKey,
			),
		)
	}
}

// warn deprecates and adds an entry to the warn list of options if the oldKey is set.
func (d *deprecator) warn(oldKey string) {
	if viper.IsSet(oldKey) {
		d.warns.Add(
			fmt.Sprintf(
				"The %q configuration key is deprecated and has been removed. Please see the changelog for more details.",
				oldKey,
			),
		)
	}
}

func (d *deprecator) String() string {
	var b strings.Builder

	for _, w := range d.warns.Slice() {
		fmt.Fprintf(&b, "WARN: %s\n", w)
	}

	for _, f := range d.fatals.Slice() {
		fmt.Fprintf(&b, "FATAL: %s\n", f)
	}

	return b.String()
}

func (d *deprecator) Log() {
	if len(d.fatals) > 0 {
		log.Fatal().Msg("\n" + d.String())
	} else if len(d.warns) > 0 {
		log.Warn().Msg("\n" + d.String())
	}
}
