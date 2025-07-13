package dsic

import (
	"crypto/tls"
	"errors"
	"fmt"
	"log"
	"net"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/juanfont/headscale/hscontrol/util"
	"github.com/juanfont/headscale/integration/dockertestutil"
	"github.com/juanfont/headscale/integration/integrationutil"
	"github.com/ory/dockertest/v3"
	"github.com/ory/dockertest/v3/docker"
)

const (
	dsicHashLength       = 6
	dockerContextPath    = "../."
	caCertRoot           = "/usr/local/share/ca-certificates"
	DERPerCertRoot       = "/usr/local/share/derper-certs"
	dockerExecuteTimeout = 60 * time.Second
)

var errDERPerStatusCodeNotOk = errors.New("DERPer status code not OK")

// DERPServerInContainer represents DERP Server in Container (DSIC).
type DERPServerInContainer struct {
	version  string
	hostname string

	pool      *dockertest.Pool
	container *dockertest.Resource
	networks  []*dockertest.Network

	stunPort            int
	derpPort            int
	caCerts             [][]byte
	tlsCert             []byte
	tlsKey              []byte
	withExtraHosts      []string
	withVerifyClientURL string
	workdir             string
}

// Option represent optional settings that can be given to a
// DERPer instance.
type Option = func(c *DERPServerInContainer)

// WithCACert adds it to the trusted surtificate of the Tailscale container.
func WithCACert(cert []byte) Option {
	return func(dsic *DERPServerInContainer) {
		dsic.caCerts = append(dsic.caCerts, cert)
	}
}

// WithOrCreateNetwork sets the Docker container network to use with
// the DERPer instance, if the parameter is nil, a new network,
// isolating the DERPer, will be created. If a network is
// passed, the DERPer instance will join the given network.
func WithOrCreateNetwork(network *dockertest.Network) Option {
	return func(dsic *DERPServerInContainer) {
		if network != nil {
			dsic.networks = append(dsic.networks, network)

			return
		}

		network, err := dockertestutil.GetFirstOrCreateNetwork(
			dsic.pool,
			dsic.hostname+"-network",
		)
		if err != nil {
			log.Fatalf("failed to create network: %s", err)
		}

		dsic.networks = append(dsic.networks, network)
	}
}

// WithDockerWorkdir allows the docker working directory to be set.
func WithDockerWorkdir(dir string) Option {
	return func(tsic *DERPServerInContainer) {
		tsic.workdir = dir
	}
}

// WithVerifyClientURL sets the URL to verify the client.
func WithVerifyClientURL(url string) Option {
	return func(tsic *DERPServerInContainer) {
		tsic.withVerifyClientURL = url
	}
}

// WithExtraHosts adds extra hosts to the container.
func WithExtraHosts(hosts []string) Option {
	return func(tsic *DERPServerInContainer) {
		tsic.withExtraHosts = hosts
	}
}

// New returns a new TailscaleInContainer instance.
func New(
	pool *dockertest.Pool,
	version string,
	networks []*dockertest.Network,
	opts ...Option,
) (*DERPServerInContainer, error) {
	hash, err := util.GenerateRandomStringDNSSafe(dsicHashLength)
	if err != nil {
		return nil, err
	}

	hostname := fmt.Sprintf("derp-%s-%s", strings.ReplaceAll(version, ".", "-"), hash)
	tlsCert, tlsKey, err := integrationutil.CreateCertificate(hostname)
	if err != nil {
		return nil, fmt.Errorf("failed to create certificates for headscale test: %w", err)
	}
	dsic := &DERPServerInContainer{
		version:  version,
		hostname: hostname,
		pool:     pool,
		networks: networks,
		tlsCert:  tlsCert,
		tlsKey:   tlsKey,
		stunPort: 3478, //nolint
		derpPort: 443,  //nolint
	}

	for _, opt := range opts {
		opt(dsic)
	}

	var cmdArgs strings.Builder
	fmt.Fprintf(&cmdArgs, "--hostname=%s", hostname)
	fmt.Fprintf(&cmdArgs, " --certmode=manual")
	fmt.Fprintf(&cmdArgs, " --certdir=%s", DERPerCertRoot)
	fmt.Fprintf(&cmdArgs, " --a=:%d", dsic.derpPort)
	fmt.Fprintf(&cmdArgs, " --stun=true")
	fmt.Fprintf(&cmdArgs, " --stun-port=%d", dsic.stunPort)
	if dsic.withVerifyClientURL != "" {
		fmt.Fprintf(&cmdArgs, " --verify-client-url=%s", dsic.withVerifyClientURL)
	}

	runOptions := &dockertest.RunOptions{
		Name:       hostname,
		Networks:   dsic.networks,
		ExtraHosts: dsic.withExtraHosts,
		// we currently need to give us some time to inject the certificate further down.
		Entrypoint: []string{"/bin/sh", "-c", "/bin/sleep 3 ; update-ca-certificates ; derper " + cmdArgs.String()},
		ExposedPorts: []string{
			"80/tcp",
			fmt.Sprintf("%d/tcp", dsic.derpPort),
			fmt.Sprintf("%d/udp", dsic.stunPort),
		},
	}

	if dsic.workdir != "" {
		runOptions.WorkingDir = dsic.workdir
	}

	// dockertest isn't very good at handling containers that has already
	// been created, this is an attempt to make sure this container isn't
	// present.
	err = pool.RemoveContainerByName(hostname)
	if err != nil {
		return nil, err
	}

	var container *dockertest.Resource
	buildOptions := &dockertest.BuildOptions{
		Dockerfile: "Dockerfile.derper",
		ContextDir: dockerContextPath,
		BuildArgs:  []docker.BuildArg{},
	}
	switch version {
	case "head":
		buildOptions.BuildArgs = append(buildOptions.BuildArgs, docker.BuildArg{
			Name:  "VERSION_BRANCH",
			Value: "main",
		})
	default:
		buildOptions.BuildArgs = append(buildOptions.BuildArgs, docker.BuildArg{
			Name:  "VERSION_BRANCH",
			Value: "v" + version,
		})
	}
	// Add integration test labels if running under hi tool
	dockertestutil.DockerAddIntegrationLabels(runOptions, "derp")

	container, err = pool.BuildAndRunWithBuildOptions(
		buildOptions,
		runOptions,
		dockertestutil.DockerRestartPolicy,
		dockertestutil.DockerAllowLocalIPv6,
		dockertestutil.DockerAllowNetworkAdministration,
	)
	if err != nil {
		return nil, fmt.Errorf(
			"%s could not start tailscale DERPer container (version: %s): %w",
			hostname,
			version,
			err,
		)
	}
	log.Printf("Created %s container\n", hostname)

	dsic.container = container

	for i, cert := range dsic.caCerts {
		err = dsic.WriteFile(fmt.Sprintf("%s/user-%d.crt", caCertRoot, i), cert)
		if err != nil {
			return nil, fmt.Errorf("failed to write TLS certificate to container: %w", err)
		}
	}
	if len(dsic.tlsCert) != 0 {
		err = dsic.WriteFile(fmt.Sprintf("%s/%s.crt", DERPerCertRoot, dsic.hostname), dsic.tlsCert)
		if err != nil {
			return nil, fmt.Errorf("failed to write TLS certificate to container: %w", err)
		}
	}
	if len(dsic.tlsKey) != 0 {
		err = dsic.WriteFile(fmt.Sprintf("%s/%s.key", DERPerCertRoot, dsic.hostname), dsic.tlsKey)
		if err != nil {
			return nil, fmt.Errorf("failed to write TLS key to container: %w", err)
		}
	}

	return dsic, nil
}

// Shutdown stops and cleans up the DERPer container.
func (t *DERPServerInContainer) Shutdown() error {
	err := t.SaveLog("/tmp/control")
	if err != nil {
		log.Printf(
			"Failed to save log from %s: %s",
			t.hostname,
			fmt.Errorf("failed to save log: %w", err),
		)
	}

	return t.pool.Purge(t.container)
}

// GetCert returns the TLS certificate of the DERPer instance.
func (t *DERPServerInContainer) GetCert() []byte {
	return t.tlsCert
}

// Hostname returns the hostname of the DERPer instance.
func (t *DERPServerInContainer) Hostname() string {
	return t.hostname
}

// Version returns the running DERPer version of the instance.
func (t *DERPServerInContainer) Version() string {
	return t.version
}

// ID returns the Docker container ID of the DERPServerInContainer
// instance.
func (t *DERPServerInContainer) ID() string {
	return t.container.Container.ID
}

func (t *DERPServerInContainer) GetHostname() string {
	return t.hostname
}

// GetSTUNPort returns the STUN port of the DERPer instance.
func (t *DERPServerInContainer) GetSTUNPort() int {
	return t.stunPort
}

// GetDERPPort returns the DERP port of the DERPer instance.
func (t *DERPServerInContainer) GetDERPPort() int {
	return t.derpPort
}

// WaitForRunning blocks until the DERPer instance is ready to be used.
func (t *DERPServerInContainer) WaitForRunning() error {
	url := "https://" + net.JoinHostPort(t.GetHostname(), strconv.Itoa(t.GetDERPPort())) + "/"
	log.Printf("waiting for DERPer to be ready at %s", url)

	insecureTransport := http.DefaultTransport.(*http.Transport).Clone()      //nolint
	insecureTransport.TLSClientConfig = &tls.Config{InsecureSkipVerify: true} //nolint
	client := &http.Client{Transport: insecureTransport}

	return t.pool.Retry(func() error {
		resp, err := client.Get(url) //nolint
		if err != nil {
			return fmt.Errorf("headscale is not ready: %w", err)
		}

		if resp.StatusCode != http.StatusOK {
			return errDERPerStatusCodeNotOk
		}

		return nil
	})
}

// ConnectToNetwork connects the DERPer instance to a network.
func (t *DERPServerInContainer) ConnectToNetwork(network *dockertest.Network) error {
	return t.container.ConnectToNetwork(network)
}

// WriteFile save file inside the container.
func (t *DERPServerInContainer) WriteFile(path string, data []byte) error {
	return integrationutil.WriteFileToContainer(t.pool, t.container, path, data)
}

// SaveLog saves the current stdout log of the container to a path
// on the host system.
func (t *DERPServerInContainer) SaveLog(path string) error {
	_, _, err := dockertestutil.SaveLog(t.pool, t.container, path)

	return err
}
