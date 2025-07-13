package hsic

import (
	"archive/tar"
	"bytes"
	"cmp"
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/netip"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/davecgh/go-spew/spew"
	v1 "github.com/juanfont/headscale/gen/go/headscale/v1"
	policyv2 "github.com/juanfont/headscale/hscontrol/policy/v2"
	"github.com/juanfont/headscale/hscontrol/types"
	"github.com/juanfont/headscale/hscontrol/util"
	"github.com/juanfont/headscale/integration/dockertestutil"
	"github.com/juanfont/headscale/integration/integrationutil"
	"github.com/ory/dockertest/v3"
	"github.com/ory/dockertest/v3/docker"
	"gopkg.in/yaml.v3"
	"tailscale.com/tailcfg"
	"tailscale.com/util/mak"
)

const (
	hsicHashLength                = 6
	dockerContextPath             = "../."
	caCertRoot                    = "/usr/local/share/ca-certificates"
	aclPolicyPath                 = "/etc/headscale/acl.hujson"
	tlsCertPath                   = "/etc/headscale/tls.cert"
	tlsKeyPath                    = "/etc/headscale/tls.key"
	headscaleDefaultPort          = 8080
	IntegrationTestDockerFileName = "Dockerfile.integration"
)

var errHeadscaleStatusCodeNotOk = errors.New("headscale status code not ok")

type fileInContainer struct {
	path     string
	contents []byte
}

// HeadscaleInContainer is an implementation of ControlServer which
// sets up a Headscale instance inside a container.
type HeadscaleInContainer struct {
	hostname string

	pool      *dockertest.Pool
	container *dockertest.Resource
	networks  []*dockertest.Network

	pgContainer *dockertest.Resource

	// optional config
	port             int
	extraPorts       []string
	caCerts          [][]byte
	hostPortBindings map[string][]string
	aclPolicy        *policyv2.Policy
	env              map[string]string
	tlsCert          []byte
	tlsKey           []byte
	filesInContainer []fileInContainer
	postgres         bool
	policyMode       types.PolicyMode
}

// Option represent optional settings that can be given to a
// Headscale instance.
type Option = func(c *HeadscaleInContainer)

// WithACLPolicy adds a hscontrol.ACLPolicy policy to the
// HeadscaleInContainer instance.
func WithACLPolicy(acl *policyv2.Policy) Option {
	return func(hsic *HeadscaleInContainer) {
		if acl == nil {
			return
		}

		// TODO(kradalby): Move somewhere appropriate
		hsic.env["HEADSCALE_POLICY_PATH"] = aclPolicyPath

		hsic.aclPolicy = acl
	}
}

// WithCACert adds it to the trusted surtificate of the container.
func WithCACert(cert []byte) Option {
	return func(hsic *HeadscaleInContainer) {
		hsic.caCerts = append(hsic.caCerts, cert)
	}
}

// WithTLS creates certificates and enables HTTPS.
func WithTLS() Option {
	return func(hsic *HeadscaleInContainer) {
		cert, key, err := integrationutil.CreateCertificate(hsic.hostname)
		if err != nil {
			log.Fatalf("failed to create certificates for headscale test: %s", err)
		}

		hsic.tlsCert = cert
		hsic.tlsKey = key
	}
}

// WithCustomTLS uses the given certificates for the Headscale instance.
func WithCustomTLS(cert, key []byte) Option {
	return func(hsic *HeadscaleInContainer) {
		hsic.tlsCert = cert
		hsic.tlsKey = key
	}
}

// WithConfigEnv takes a map of environment variables that
// can be used to override Headscale configuration.
func WithConfigEnv(configEnv map[string]string) Option {
	return func(hsic *HeadscaleInContainer) {
		for key, value := range configEnv {
			hsic.env[key] = value
		}
	}
}

// WithPort sets the port on where to run Headscale.
func WithPort(port int) Option {
	return func(hsic *HeadscaleInContainer) {
		hsic.port = port
	}
}

// WithExtraPorts exposes additional ports on the container (e.g. 3478/udp for STUN).
func WithExtraPorts(ports []string) Option {
	return func(hsic *HeadscaleInContainer) {
		hsic.extraPorts = ports
	}
}

func WithHostPortBindings(bindings map[string][]string) Option {
	return func(hsic *HeadscaleInContainer) {
		hsic.hostPortBindings = bindings
	}
}

// WithTestName sets a name for the test, this will be reflected
// in the Docker container name.
func WithTestName(testName string) Option {
	return func(hsic *HeadscaleInContainer) {
		hash, _ := util.GenerateRandomStringDNSSafe(hsicHashLength)

		hostname := fmt.Sprintf("hs-%s-%s", testName, hash)
		hsic.hostname = hostname
	}
}

// WithHostname sets the hostname of the Headscale instance.
func WithHostname(hostname string) Option {
	return func(hsic *HeadscaleInContainer) {
		hsic.hostname = hostname
	}
}

// WithFileInContainer adds a file to the container at the given path.
func WithFileInContainer(path string, contents []byte) Option {
	return func(hsic *HeadscaleInContainer) {
		hsic.filesInContainer = append(hsic.filesInContainer,
			fileInContainer{
				path:     path,
				contents: contents,
			})
	}
}

// WithPostgres spins up a Postgres container and
// sets it as the main database.
func WithPostgres() Option {
	return func(hsic *HeadscaleInContainer) {
		hsic.postgres = true
	}
}

// WithPolicy sets the policy mode for headscale.
func WithPolicyMode(mode types.PolicyMode) Option {
	return func(hsic *HeadscaleInContainer) {
		hsic.policyMode = mode
		hsic.env["HEADSCALE_POLICY_MODE"] = string(mode)
	}
}

// WithIPAllocationStrategy sets the tests IP Allocation strategy.
func WithIPAllocationStrategy(strategy types.IPAllocationStrategy) Option {
	return func(hsic *HeadscaleInContainer) {
		hsic.env["HEADSCALE_PREFIXES_ALLOCATION"] = string(strategy)
	}
}

// WithEmbeddedDERPServerOnly configures Headscale to start
// and only use the embedded DERP server.
// It requires WithTLS and WithHostnameAsServerURL to be
// set.
func WithEmbeddedDERPServerOnly() Option {
	return func(hsic *HeadscaleInContainer) {
		hsic.env["HEADSCALE_DERP_URLS"] = ""
		hsic.env["HEADSCALE_DERP_SERVER_ENABLED"] = "true"
		hsic.env["HEADSCALE_DERP_SERVER_REGION_ID"] = "999"
		hsic.env["HEADSCALE_DERP_SERVER_REGION_CODE"] = "headscale"
		hsic.env["HEADSCALE_DERP_SERVER_REGION_NAME"] = "Headscale Embedded DERP"
		hsic.env["HEADSCALE_DERP_SERVER_STUN_LISTEN_ADDR"] = "0.0.0.0:3478"
		hsic.env["HEADSCALE_DERP_SERVER_PRIVATE_KEY_PATH"] = "/tmp/derp.key"

		// Envknob for enabling DERP debug logs
		hsic.env["DERP_DEBUG_LOGS"] = "true"
		hsic.env["DERP_PROBER_DEBUG_LOGS"] = "true"
	}
}

// WithDERPConfig configures Headscale use a custom
// DERP server only.
func WithDERPConfig(derpMap tailcfg.DERPMap) Option {
	return func(hsic *HeadscaleInContainer) {
		contents, err := yaml.Marshal(derpMap)
		if err != nil {
			log.Fatalf("failed to marshal DERP map: %s", err)

			return
		}

		hsic.env["HEADSCALE_DERP_PATHS"] = "/etc/headscale/derp.yml"
		hsic.filesInContainer = append(hsic.filesInContainer,
			fileInContainer{
				path:     "/etc/headscale/derp.yml",
				contents: contents,
			})

		// Disable global DERP server and embedded DERP server
		hsic.env["HEADSCALE_DERP_URLS"] = ""
		hsic.env["HEADSCALE_DERP_SERVER_ENABLED"] = "false"

		// Envknob for enabling DERP debug logs
		hsic.env["DERP_DEBUG_LOGS"] = "true"
		hsic.env["DERP_PROBER_DEBUG_LOGS"] = "true"
	}
}

// WithTuning allows changing the tuning settings easily.
func WithTuning(batchTimeout time.Duration, mapSessionChanSize int) Option {
	return func(hsic *HeadscaleInContainer) {
		hsic.env["HEADSCALE_TUNING_BATCH_CHANGE_DELAY"] = batchTimeout.String()
		hsic.env["HEADSCALE_TUNING_NODE_MAPSESSION_BUFFERED_CHAN_SIZE"] = strconv.Itoa(mapSessionChanSize)
	}
}

func WithTimezone(timezone string) Option {
	return func(hsic *HeadscaleInContainer) {
		hsic.env["TZ"] = timezone
	}
}

// New returns a new HeadscaleInContainer instance.
func New(
	pool *dockertest.Pool,
	networks []*dockertest.Network,
	opts ...Option,
) (*HeadscaleInContainer, error) {
	hash, err := util.GenerateRandomStringDNSSafe(hsicHashLength)
	if err != nil {
		return nil, err
	}

	hostname := "hs-" + hash

	hsic := &HeadscaleInContainer{
		hostname: hostname,
		port:     headscaleDefaultPort,

		pool:     pool,
		networks: networks,

		env:              DefaultConfigEnv(),
		filesInContainer: []fileInContainer{},
		policyMode:       types.PolicyModeFile,
	}

	for _, opt := range opts {
		opt(hsic)
	}

	log.Println("NAME: ", hsic.hostname)

	portProto := fmt.Sprintf("%d/tcp", hsic.port)

	headscaleBuildOptions := &dockertest.BuildOptions{
		Dockerfile: IntegrationTestDockerFileName,
		ContextDir: dockerContextPath,
	}

	if hsic.postgres {
		hsic.env["HEADSCALE_DATABASE_TYPE"] = "postgres"
		hsic.env["HEADSCALE_DATABASE_POSTGRES_HOST"] = "postgres-" + hash
		hsic.env["HEADSCALE_DATABASE_POSTGRES_USER"] = "headscale"
		hsic.env["HEADSCALE_DATABASE_POSTGRES_PASS"] = "headscale"
		hsic.env["HEADSCALE_DATABASE_POSTGRES_NAME"] = "headscale"
		delete(hsic.env, "HEADSCALE_DATABASE_SQLITE_PATH")

		pgRunOptions := &dockertest.RunOptions{
			Name:       "postgres-" + hash,
			Repository: "postgres",
			Tag:        "latest",
			Networks:   networks,
			Env: []string{
				"POSTGRES_USER=headscale",
				"POSTGRES_PASSWORD=headscale",
				"POSTGRES_DB=headscale",
			},
		}

		// Add integration test labels if running under hi tool
		dockertestutil.DockerAddIntegrationLabels(pgRunOptions, "postgres")

		pg, err := pool.RunWithOptions(pgRunOptions)
		if err != nil {
			return nil, fmt.Errorf("starting postgres container: %w", err)
		}

		hsic.pgContainer = pg
	}

	env := []string{
		"HEADSCALE_DEBUG_PROFILING_ENABLED=1",
		"HEADSCALE_DEBUG_PROFILING_PATH=/tmp/profile",
		"HEADSCALE_DEBUG_DUMP_MAPRESPONSE_PATH=/tmp/mapresponses",
		"HEADSCALE_DEBUG_DEADLOCK=1",
		"HEADSCALE_DEBUG_DEADLOCK_TIMEOUT=5s",
		"HEADSCALE_DEBUG_HIGH_CARDINALITY_METRICS=1",
		"HEADSCALE_DEBUG_DUMP_CONFIG=1",
	}
	if hsic.hasTLS() {
		hsic.env["HEADSCALE_TLS_CERT_PATH"] = tlsCertPath
		hsic.env["HEADSCALE_TLS_KEY_PATH"] = tlsKeyPath
	}

	// Server URL and Listen Addr should not be overridable outside of
	// the configuration passed to docker.
	hsic.env["HEADSCALE_SERVER_URL"] = hsic.GetEndpoint()
	hsic.env["HEADSCALE_LISTEN_ADDR"] = fmt.Sprintf("0.0.0.0:%d", hsic.port)

	for key, value := range hsic.env {
		env = append(env, fmt.Sprintf("%s=%s", key, value))
	}

	log.Printf("ENV: \n%s", spew.Sdump(hsic.env))

	runOptions := &dockertest.RunOptions{
		Name:         hsic.hostname,
		ExposedPorts: append([]string{portProto, "9090/tcp"}, hsic.extraPorts...),
		Networks:     networks,
		// Cmd:          []string{"headscale", "serve"},
		// TODO(kradalby): Get rid of this hack, we currently need to give us some
		// to inject the headscale configuration further down.
		Entrypoint: []string{"/bin/bash", "-c", "/bin/sleep 3 ; update-ca-certificates ; headscale serve ; /bin/sleep 30"},
		Env:        env,
	}

	if len(hsic.hostPortBindings) > 0 {
		runOptions.PortBindings = map[docker.Port][]docker.PortBinding{}
		for port, hostPorts := range hsic.hostPortBindings {
			runOptions.PortBindings[docker.Port(port)] = []docker.PortBinding{}
			for _, hostPort := range hostPorts {
				runOptions.PortBindings[docker.Port(port)] = append(
					runOptions.PortBindings[docker.Port(port)],
					docker.PortBinding{HostPort: hostPort})
			}
		}
	}

	// dockertest isn't very good at handling containers that has already
	// been created, this is an attempt to make sure this container isn't
	// present.
	err = pool.RemoveContainerByName(hsic.hostname)
	if err != nil {
		return nil, err
	}

	// Add integration test labels if running under hi tool
	dockertestutil.DockerAddIntegrationLabels(runOptions, "headscale")

	container, err := pool.BuildAndRunWithBuildOptions(
		headscaleBuildOptions,
		runOptions,
		dockertestutil.DockerRestartPolicy,
		dockertestutil.DockerAllowLocalIPv6,
		dockertestutil.DockerAllowNetworkAdministration,
	)
	if err != nil {
		return nil, fmt.Errorf("could not start headscale container: %w", err)
	}
	log.Printf("Created %s container\n", hsic.hostname)

	hsic.container = container

	// Write the CA certificates to the container
	for i, cert := range hsic.caCerts {
		err = hsic.WriteFile(fmt.Sprintf("%s/user-%d.crt", caCertRoot, i), cert)
		if err != nil {
			return nil, fmt.Errorf("failed to write TLS certificate to container: %w", err)
		}
	}

	err = hsic.WriteFile("/etc/headscale/config.yaml", []byte(MinimumConfigYAML()))
	if err != nil {
		return nil, fmt.Errorf("failed to write headscale config to container: %w", err)
	}

	if hsic.aclPolicy != nil {
		err = hsic.writePolicy(hsic.aclPolicy)
		if err != nil {
			return nil, fmt.Errorf("writing policy: %w", err)
		}
	}

	if hsic.hasTLS() {
		err = hsic.WriteFile(tlsCertPath, hsic.tlsCert)
		if err != nil {
			return nil, fmt.Errorf("failed to write TLS certificate to container: %w", err)
		}

		err = hsic.WriteFile(tlsKeyPath, hsic.tlsKey)
		if err != nil {
			return nil, fmt.Errorf("failed to write TLS key to container: %w", err)
		}
	}

	for _, f := range hsic.filesInContainer {
		if err := hsic.WriteFile(f.path, f.contents); err != nil {
			return nil, fmt.Errorf("failed to write %q: %w", f.path, err)
		}
	}

	// Load the database from policy file on repeat until it succeeds,
	// this is done as the container sleeps before starting headscale.
	if hsic.aclPolicy != nil && hsic.policyMode == types.PolicyModeDB {
		err := pool.Retry(hsic.reloadDatabasePolicy)
		if err != nil {
			return nil, fmt.Errorf("loading database policy on startup: %w", err)
		}
	}

	return hsic, nil
}

func (t *HeadscaleInContainer) ConnectToNetwork(network *dockertest.Network) error {
	return t.container.ConnectToNetwork(network)
}

func (t *HeadscaleInContainer) hasTLS() bool {
	return len(t.tlsCert) != 0 && len(t.tlsKey) != 0
}

// Shutdown stops and cleans up the Headscale container.
func (t *HeadscaleInContainer) Shutdown() (string, string, error) {
	stdoutPath, stderrPath, err := t.SaveLog("/tmp/control")
	if err != nil {
		log.Printf(
			"Failed to save log from control: %s",
			fmt.Errorf("failed to save log from control: %w", err),
		)
	}

	err = t.SaveMetrics(fmt.Sprintf("/tmp/control/%s_metrics.txt", t.hostname))
	if err != nil {
		log.Printf(
			"Failed to metrics from control: %s",
			err,
		)
	}

	// Send a interrupt signal to the "headscale" process inside the container
	// allowing it to shut down gracefully and flush the profile to disk.
	// The container will live for a bit longer due to the sleep at the end.
	err = t.SendInterrupt()
	if err != nil {
		log.Printf(
			"Failed to send graceful interrupt to control: %s",
			fmt.Errorf("failed to send graceful interrupt to control: %w", err),
		)
	}

	err = t.SaveProfile("/tmp/control")
	if err != nil {
		log.Printf(
			"Failed to save profile from control: %s",
			fmt.Errorf("failed to save profile from control: %w", err),
		)
	}

	err = t.SaveMapResponses("/tmp/control")
	if err != nil {
		log.Printf(
			"Failed to save mapresponses from control: %s",
			fmt.Errorf("failed to save mapresponses from control: %w", err),
		)
	}

	// We dont have a database to save if we use postgres
	if !t.postgres {
		err = t.SaveDatabase("/tmp/control")
		if err != nil {
			log.Printf(
				"Failed to save database from control: %s",
				fmt.Errorf("failed to save database from control: %w", err),
			)
		}
	}

	// Cleanup postgres container if enabled.
	if t.postgres {
		t.pool.Purge(t.pgContainer)
	}

	return stdoutPath, stderrPath, t.pool.Purge(t.container)
}

// WriteLogs writes the current stdout/stderr log of the container to
// the given io.Writers.
func (t *HeadscaleInContainer) WriteLogs(stdout, stderr io.Writer) error {
	return dockertestutil.WriteLog(t.pool, t.container, stdout, stderr)
}

// SaveLog saves the current stdout log of the container to a path
// on the host system.
func (t *HeadscaleInContainer) SaveLog(path string) (string, string, error) {
	return dockertestutil.SaveLog(t.pool, t.container, path)
}

func (t *HeadscaleInContainer) SaveMetrics(savePath string) error {
	resp, err := http.Get(fmt.Sprintf("http://%s:9090/metrics", t.hostname))
	if err != nil {
		return fmt.Errorf("getting metrics: %w", err)
	}
	defer resp.Body.Close()
	out, err := os.Create(savePath)
	if err != nil {
		return fmt.Errorf("creating file for metrics: %w", err)
	}
	defer out.Close()
	_, err = io.Copy(out, resp.Body)
	if err != nil {
		return fmt.Errorf("copy response to file: %w", err)
	}

	return nil
}

// extractTarToDirectory extracts a tar archive to a directory.
func extractTarToDirectory(tarData []byte, targetDir string) error {
	if err := os.MkdirAll(targetDir, 0o755); err != nil {
		return fmt.Errorf("failed to create directory %s: %w", targetDir, err)
	}

	tarReader := tar.NewReader(bytes.NewReader(tarData))
	for {
		header, err := tarReader.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return fmt.Errorf("failed to read tar header: %w", err)
		}

		// Clean the path to prevent directory traversal
		cleanName := filepath.Clean(header.Name)
		if strings.Contains(cleanName, "..") {
			continue // Skip potentially dangerous paths
		}

		targetPath := filepath.Join(targetDir, filepath.Base(cleanName))

		switch header.Typeflag {
		case tar.TypeDir:
			// Create directory
			if err := os.MkdirAll(targetPath, os.FileMode(header.Mode)); err != nil {
				return fmt.Errorf("failed to create directory %s: %w", targetPath, err)
			}
		case tar.TypeReg:
			// Create file
			outFile, err := os.Create(targetPath)
			if err != nil {
				return fmt.Errorf("failed to create file %s: %w", targetPath, err)
			}

			if _, err := io.Copy(outFile, tarReader); err != nil {
				outFile.Close()
				return fmt.Errorf("failed to copy file contents: %w", err)
			}
			outFile.Close()

			// Set file permissions
			if err := os.Chmod(targetPath, os.FileMode(header.Mode)); err != nil {
				return fmt.Errorf("failed to set file permissions: %w", err)
			}
		}
	}

	return nil
}

func (t *HeadscaleInContainer) SaveProfile(savePath string) error {
	tarFile, err := t.FetchPath("/tmp/profile")
	if err != nil {
		return err
	}

	targetDir := path.Join(savePath, t.hostname+"-pprof")

	return extractTarToDirectory(tarFile, targetDir)
}

func (t *HeadscaleInContainer) SaveMapResponses(savePath string) error {
	tarFile, err := t.FetchPath("/tmp/mapresponses")
	if err != nil {
		return err
	}

	targetDir := path.Join(savePath, t.hostname+"-mapresponses")

	return extractTarToDirectory(tarFile, targetDir)
}

func (t *HeadscaleInContainer) SaveDatabase(savePath string) error {
	// If using PostgreSQL, skip database file extraction
	if t.postgres {
		return nil
	}

	// First, let's see what files are actually in /tmp
	tmpListing, err := t.Execute([]string{"ls", "-la", "/tmp/"})
	if err != nil {
		log.Printf("Warning: could not list /tmp directory: %v", err)
	} else {
		log.Printf("Contents of /tmp in container %s:\n%s", t.hostname, tmpListing)
	}

	// Also check for any .sqlite files
	sqliteFiles, err := t.Execute([]string{"find", "/tmp", "-name", "*.sqlite*", "-type", "f"})
	if err != nil {
		log.Printf("Warning: could not find sqlite files: %v", err)
	} else {
		log.Printf("SQLite files found in %s:\n%s", t.hostname, sqliteFiles)
	}

	// Check if the database file exists and has a schema
	dbPath := "/tmp/integration_test_db.sqlite3"
	fileInfo, err := t.Execute([]string{"ls", "-la", dbPath})
	if err != nil {
		return fmt.Errorf("database file does not exist at %s: %w", dbPath, err)
	}
	log.Printf("Database file info: %s", fileInfo)

	// Check if the database has any tables (schema)
	schemaCheck, err := t.Execute([]string{"sqlite3", dbPath, ".schema"})
	if err != nil {
		return fmt.Errorf("failed to check database schema (sqlite3 command failed): %w", err)
	}

	if strings.TrimSpace(schemaCheck) == "" {
		return errors.New("database file exists but has no schema (empty database)")
	}

	// Show a preview of the schema (first 500 chars)
	schemaPreview := schemaCheck
	if len(schemaPreview) > 500 {
		schemaPreview = schemaPreview[:500] + "..."
	}

	tarFile, err := t.FetchPath("/tmp/integration_test_db.sqlite3")
	if err != nil {
		return fmt.Errorf("failed to fetch database file: %w", err)
	}

	// For database, extract the first regular file (should be the SQLite file)
	tarReader := tar.NewReader(bytes.NewReader(tarFile))
	for {
		header, err := tarReader.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return fmt.Errorf("failed to read tar header: %w", err)
		}

		log.Printf("Found file in tar: %s (type: %d, size: %d)", header.Name, header.Typeflag, header.Size)

		// Extract the first regular file we find
		if header.Typeflag == tar.TypeReg {
			dbPath := path.Join(savePath, t.hostname+".db")
			outFile, err := os.Create(dbPath)
			if err != nil {
				return fmt.Errorf("failed to create database file: %w", err)
			}

			written, err := io.Copy(outFile, tarReader)
			outFile.Close()
			if err != nil {
				return fmt.Errorf("failed to copy database file: %w", err)
			}

			log.Printf("Extracted database file: %s (%d bytes written, header claimed %d bytes)", dbPath, written, header.Size)

			// Check if we actually wrote something
			if written == 0 {
				return fmt.Errorf("database file is empty (size: %d, header size: %d)", written, header.Size)
			}

			return nil
		}
	}

	return errors.New("no regular file found in database tar archive")
}

// Execute runs a command inside the Headscale container and returns the
// result of stdout as a string.
func (t *HeadscaleInContainer) Execute(
	command []string,
) (string, error) {
	stdout, stderr, err := dockertestutil.ExecuteCommand(
		t.container,
		command,
		[]string{},
	)
	if err != nil {
		log.Printf("command: %v", command)
		log.Printf("command stderr: %s\n", stderr)

		if stdout != "" {
			log.Printf("command stdout: %s\n", stdout)
		}

		return stdout, fmt.Errorf("executing command in docker: %w, stderr: %s", err, stderr)
	}

	return stdout, nil
}

// GetPort returns the docker container port as a string.
func (t *HeadscaleInContainer) GetPort() string {
	return strconv.Itoa(t.port)
}

// GetHealthEndpoint returns a health endpoint for the HeadscaleInContainer
// instance.
func (t *HeadscaleInContainer) GetHealthEndpoint() string {
	return t.GetEndpoint() + "/health"
}

// GetEndpoint returns the Headscale endpoint for the HeadscaleInContainer.
func (t *HeadscaleInContainer) GetEndpoint() string {
	hostEndpoint := fmt.Sprintf("%s:%d",
		t.GetHostname(),
		t.port)

	if t.hasTLS() {
		return "https://" + hostEndpoint
	}

	return "http://" + hostEndpoint
}

// GetCert returns the public certificate of the HeadscaleInContainer.
func (t *HeadscaleInContainer) GetCert() []byte {
	return t.tlsCert
}

// GetHostname returns the hostname of the HeadscaleInContainer.
func (t *HeadscaleInContainer) GetHostname() string {
	return t.hostname
}

// WaitForRunning blocks until the Headscale instance is ready to
// serve clients.
func (t *HeadscaleInContainer) WaitForRunning() error {
	url := t.GetHealthEndpoint()

	log.Printf("waiting for headscale to be ready at %s", url)

	client := &http.Client{}

	if t.hasTLS() {
		insecureTransport := http.DefaultTransport.(*http.Transport).Clone()      //nolint
		insecureTransport.TLSClientConfig = &tls.Config{InsecureSkipVerify: true} //nolint
		client = &http.Client{Transport: insecureTransport}
	}

	return t.pool.Retry(func() error {
		resp, err := client.Get(url) //nolint
		if err != nil {
			return fmt.Errorf("headscale is not ready: %w", err)
		}

		if resp.StatusCode != http.StatusOK {
			return errHeadscaleStatusCodeNotOk
		}

		return nil
	})
}

// CreateUser adds a new user to the Headscale instance.
func (t *HeadscaleInContainer) CreateUser(
	user string,
) (*v1.User, error) {
	command := []string{"headscale", "users", "create", user, fmt.Sprintf("--email=%s@test.no", user), "--output", "json"}

	result, _, err := dockertestutil.ExecuteCommand(
		t.container,
		command,
		[]string{},
	)
	if err != nil {
		return nil, err
	}

	var u v1.User
	err = json.Unmarshal([]byte(result), &u)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal user: %w", err)
	}

	return &u, nil
}

// CreateAuthKey creates a new "authorisation key" for a User that can be used
// to authorise a TailscaleClient with the Headscale instance.
func (t *HeadscaleInContainer) CreateAuthKey(
	user uint64,
	reusable bool,
	ephemeral bool,
) (*v1.PreAuthKey, error) {
	command := []string{
		"headscale",
		"--user",
		strconv.FormatUint(user, 10),
		"preauthkeys",
		"create",
		"--expiration",
		"24h",
		"--output",
		"json",
	}

	if reusable {
		command = append(command, "--reusable")
	}

	if ephemeral {
		command = append(command, "--ephemeral")
	}

	result, _, err := dockertestutil.ExecuteCommand(
		t.container,
		command,
		[]string{},
	)
	if err != nil {
		return nil, fmt.Errorf("failed to execute create auth key command: %w", err)
	}

	var preAuthKey v1.PreAuthKey
	err = json.Unmarshal([]byte(result), &preAuthKey)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal auth key: %w", err)
	}

	return &preAuthKey, nil
}

// ListNodes lists the currently registered Nodes in headscale.
// Optionally a list of usernames can be passed to get users for
// specific users.
func (t *HeadscaleInContainer) ListNodes(
	users ...string,
) ([]*v1.Node, error) {
	var ret []*v1.Node
	execUnmarshal := func(command []string) error {
		result, _, err := dockertestutil.ExecuteCommand(
			t.container,
			command,
			[]string{},
		)
		if err != nil {
			return fmt.Errorf("failed to execute list node command: %w", err)
		}

		var nodes []*v1.Node
		err = json.Unmarshal([]byte(result), &nodes)
		if err != nil {
			return fmt.Errorf("failed to unmarshal nodes: %w", err)
		}

		ret = append(ret, nodes...)

		return nil
	}

	if len(users) == 0 {
		err := execUnmarshal([]string{"headscale", "nodes", "list", "--output", "json"})
		if err != nil {
			return nil, err
		}
	} else {
		for _, user := range users {
			command := []string{"headscale", "--user", user, "nodes", "list", "--output", "json"}

			err := execUnmarshal(command)
			if err != nil {
				return nil, err
			}
		}
	}

	sort.Slice(ret, func(i, j int) bool {
		return cmp.Compare(ret[i].GetId(), ret[j].GetId()) == -1
	})

	return ret, nil
}

func (t *HeadscaleInContainer) NodesByUser() (map[string][]*v1.Node, error) {
	nodes, err := t.ListNodes()
	if err != nil {
		return nil, err
	}

	var userMap map[string][]*v1.Node
	for _, node := range nodes {
		if _, ok := userMap[node.GetUser().GetName()]; !ok {
			mak.Set(&userMap, node.GetUser().GetName(), []*v1.Node{node})
		} else {
			userMap[node.GetUser().GetName()] = append(userMap[node.GetUser().GetName()], node)
		}
	}

	return userMap, nil
}

func (t *HeadscaleInContainer) NodesByName() (map[string]*v1.Node, error) {
	nodes, err := t.ListNodes()
	if err != nil {
		return nil, err
	}

	var nameMap map[string]*v1.Node
	for _, node := range nodes {
		mak.Set(&nameMap, node.GetName(), node)
	}

	return nameMap, nil
}

// ListUsers returns a list of users from Headscale.
func (t *HeadscaleInContainer) ListUsers() ([]*v1.User, error) {
	command := []string{"headscale", "users", "list", "--output", "json"}

	result, _, err := dockertestutil.ExecuteCommand(
		t.container,
		command,
		[]string{},
	)
	if err != nil {
		return nil, fmt.Errorf("failed to execute list node command: %w", err)
	}

	var users []*v1.User
	err = json.Unmarshal([]byte(result), &users)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal nodes: %w", err)
	}

	return users, nil
}

// MapUsers returns a map of users from Headscale. It is keyed by the
// user name.
func (t *HeadscaleInContainer) MapUsers() (map[string]*v1.User, error) {
	users, err := t.ListUsers()
	if err != nil {
		return nil, err
	}

	var userMap map[string]*v1.User
	for _, user := range users {
		mak.Set(&userMap, user.GetName(), user)
	}

	return userMap, nil
}

func (h *HeadscaleInContainer) SetPolicy(pol *policyv2.Policy) error {
	err := h.writePolicy(pol)
	if err != nil {
		return fmt.Errorf("writing policy file: %w", err)
	}

	switch h.policyMode {
	case types.PolicyModeDB:
		err := h.reloadDatabasePolicy()
		if err != nil {
			return fmt.Errorf("reloading database policy: %w", err)
		}
	case types.PolicyModeFile:
		err := h.Reload()
		if err != nil {
			return fmt.Errorf("reloading policy file: %w", err)
		}
	default:
		panic("policy mode is not valid: " + h.policyMode)
	}

	return nil
}

func (h *HeadscaleInContainer) reloadDatabasePolicy() error {
	_, err := h.Execute(
		[]string{
			"headscale",
			"policy",
			"set",
			"-f",
			aclPolicyPath,
		},
	)
	if err != nil {
		return fmt.Errorf("setting policy with db command: %w", err)
	}

	return nil
}

func (h *HeadscaleInContainer) writePolicy(pol *policyv2.Policy) error {
	pBytes, err := json.Marshal(pol)
	if err != nil {
		return fmt.Errorf("marshalling pol: %w", err)
	}

	err = h.WriteFile(aclPolicyPath, pBytes)
	if err != nil {
		return fmt.Errorf("writing policy to headscale container: %w", err)
	}

	return nil
}

func (h *HeadscaleInContainer) PID() (int, error) {
	cmd := []string{"bash", "-c", `ps aux | grep headscale | grep -v grep | awk '{print $2}'`}
	output, err := h.Execute(cmd)
	if err != nil {
		return 0, fmt.Errorf("failed to execute command: %w", err)
	}

	lines := strings.TrimSpace(output)
	if lines == "" {
		return 0, os.ErrNotExist // No output means no process found
	}

	pids := make([]int, 0, len(lines))
	for _, line := range strings.Split(lines, "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		pidInt, err := strconv.Atoi(line)
		if err != nil {
			return 0, fmt.Errorf("parsing PID: %w", err)
		}
		// We dont care about the root pid for the container
		if pidInt == 1 {
			continue
		}
		pids = append(pids, pidInt)
	}

	switch len(pids) {
	case 0:
		return 0, os.ErrNotExist
	case 1:
		return pids[0], nil
	default:
		return 0, errors.New("multiple headscale processes running")
	}
}

// Reload sends a SIGHUP to the headscale process to reload internals,
// for example Policy from file.
func (h *HeadscaleInContainer) Reload() error {
	pid, err := h.PID()
	if err != nil {
		return fmt.Errorf("getting headscale PID: %w", err)
	}

	_, err = h.Execute([]string{"kill", "-HUP", strconv.Itoa(pid)})
	if err != nil {
		return fmt.Errorf("reloading headscale with HUP: %w", err)
	}

	return nil
}

// ApproveRoutes approves routes for a node.
func (t *HeadscaleInContainer) ApproveRoutes(id uint64, routes []netip.Prefix) (*v1.Node, error) {
	command := []string{
		"headscale", "nodes", "approve-routes",
		"--output", "json",
		"--identifier", strconv.FormatUint(id, 10),
		"--routes=" + strings.Join(util.PrefixesToString(routes), ","),
	}

	result, _, err := dockertestutil.ExecuteCommand(
		t.container,
		command,
		[]string{},
	)
	if err != nil {
		return nil, fmt.Errorf("failed to execute list node command: %w", err)
	}

	var node *v1.Node
	err = json.Unmarshal([]byte(result), &node)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal nodes: %w", err)
	}

	return node, nil
}

// WriteFile save file inside the Headscale container.
func (t *HeadscaleInContainer) WriteFile(path string, data []byte) error {
	return integrationutil.WriteFileToContainer(t.pool, t.container, path, data)
}

// FetchPath gets a path from inside the Headscale container and returns a tar
// file as byte array.
func (t *HeadscaleInContainer) FetchPath(path string) ([]byte, error) {
	return integrationutil.FetchPathFromContainer(t.pool, t.container, path)
}

func (t *HeadscaleInContainer) SendInterrupt() error {
	pid, err := t.Execute([]string{"pidof", "headscale"})
	if err != nil {
		return err
	}

	_, err = t.Execute([]string{"kill", "-2", strings.Trim(pid, "'\n")})
	if err != nil {
		return err
	}

	return nil
}
