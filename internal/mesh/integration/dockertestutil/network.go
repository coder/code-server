package dockertestutil

import (
	"errors"
	"fmt"
	"log"
	"net"

	"github.com/juanfont/headscale/hscontrol/util"
	"github.com/ory/dockertest/v3"
	"github.com/ory/dockertest/v3/docker"
)

var ErrContainerNotFound = errors.New("container not found")

func GetFirstOrCreateNetwork(pool *dockertest.Pool, name string) (*dockertest.Network, error) {
	networks, err := pool.NetworksByName(name)
	if err != nil {
		return nil, fmt.Errorf("looking up network names: %w", err)
	}
	if len(networks) == 0 {
		if _, err := pool.CreateNetwork(name); err == nil {
			// Create does not give us an updated version of the resource, so we need to
			// get it again.
			networks, err := pool.NetworksByName(name)
			if err != nil {
				return nil, err
			}

			return &networks[0], nil
		} else {
			return nil, fmt.Errorf("creating network: %w", err)
		}
	}

	return &networks[0], nil
}

func AddContainerToNetwork(
	pool *dockertest.Pool,
	network *dockertest.Network,
	testContainer string,
) error {
	containers, err := pool.Client.ListContainers(docker.ListContainersOptions{
		All: true,
		Filters: map[string][]string{
			"name": {testContainer},
		},
	})
	if err != nil {
		return err
	}

	err = pool.Client.ConnectNetwork(network.Network.ID, docker.NetworkConnectionOptions{
		Container: containers[0].ID,
	})
	if err != nil {
		return err
	}

	// TODO(kradalby): This doesn't work reliably, but calling the exact same functions
	// seem to work fine...
	// if container, ok := pool.ContainerByName("/" + testContainer); ok {
	// 	err := container.ConnectToNetwork(network)
	// 	if err != nil {
	// 		return err
	// 	}
	// }

	return nil
}

// RandomFreeHostPort asks the kernel for a free open port that is ready to use.
// (from https://github.com/phayes/freeport)
func RandomFreeHostPort() (int, error) {
	addr, err := net.ResolveTCPAddr("tcp", "localhost:0")
	if err != nil {
		return 0, err
	}

	listener, err := net.ListenTCP("tcp", addr)
	if err != nil {
		return 0, err
	}
	defer listener.Close()
	//nolint:forcetypeassert
	return listener.Addr().(*net.TCPAddr).Port, nil
}

// CleanUnreferencedNetworks removes networks that are not referenced by any containers.
func CleanUnreferencedNetworks(pool *dockertest.Pool) error {
	filter := "name=hs-"
	networks, err := pool.NetworksByName(filter)
	if err != nil {
		return fmt.Errorf("getting networks by filter %q: %w", filter, err)
	}

	for _, network := range networks {
		if network.Network.Containers == nil || len(network.Network.Containers) == 0 {
			err := pool.RemoveNetwork(&network)
			if err != nil {
				log.Printf("removing network %s: %s", network.Network.Name, err)
			}
		}
	}

	return nil
}

// CleanImagesInCI removes images if running in CI.
func CleanImagesInCI(pool *dockertest.Pool) error {
	if !util.IsCI() {
		log.Println("Skipping image cleanup outside of CI")
		return nil
	}

	images, err := pool.Client.ListImages(docker.ListImagesOptions{})
	if err != nil {
		return fmt.Errorf("getting images: %w", err)
	}

	for _, image := range images {
		log.Printf("removing image: %s, %v", image.ID, image.RepoTags)
		_ = pool.Client.RemoveImage(image.ID)
	}

	return nil
}

// DockerRestartPolicy sets the restart policy for containers.
func DockerRestartPolicy(config *docker.HostConfig) {
	config.RestartPolicy = docker.RestartPolicy{
		Name: "unless-stopped",
	}
}

// DockerAllowLocalIPv6 allows IPv6 traffic within the container.
func DockerAllowLocalIPv6(config *docker.HostConfig) {
	config.NetworkMode = "default"
	config.Sysctls = map[string]string{
		"net.ipv6.conf.all.disable_ipv6": "0",
	}
}

// DockerAllowNetworkAdministration gives the container network administration capabilities.
func DockerAllowNetworkAdministration(config *docker.HostConfig) {
	config.CapAdd = append(config.CapAdd, "NET_ADMIN")
	config.Privileged = true
}
