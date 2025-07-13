package main

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/client"
	"github.com/docker/docker/errdefs"
)

// cleanupBeforeTest performs cleanup operations before running tests.
func cleanupBeforeTest(ctx context.Context) error {
	if err := killTestContainers(ctx); err != nil {
		return fmt.Errorf("failed to kill test containers: %w", err)
	}

	if err := pruneDockerNetworks(ctx); err != nil {
		return fmt.Errorf("failed to prune networks: %w", err)
	}

	return nil
}

// cleanupAfterTest removes the test container after completion.
func cleanupAfterTest(ctx context.Context, cli *client.Client, containerID string) error {
	return cli.ContainerRemove(ctx, containerID, container.RemoveOptions{
		Force: true,
	})
}

// killTestContainers terminates and removes all test containers.
func killTestContainers(ctx context.Context) error {
	cli, err := createDockerClient()
	if err != nil {
		return fmt.Errorf("failed to create Docker client: %w", err)
	}
	defer cli.Close()

	containers, err := cli.ContainerList(ctx, container.ListOptions{
		All: true,
	})
	if err != nil {
		return fmt.Errorf("failed to list containers: %w", err)
	}

	removed := 0
	for _, cont := range containers {
		shouldRemove := false
		for _, name := range cont.Names {
			if strings.Contains(name, "headscale-test-suite") ||
				strings.Contains(name, "hs-") ||
				strings.Contains(name, "ts-") ||
				strings.Contains(name, "derp-") {
				shouldRemove = true
				break
			}
		}

		if shouldRemove {
			// First kill the container if it's running
			if cont.State == "running" {
				_ = cli.ContainerKill(ctx, cont.ID, "KILL")
			}

			// Then remove the container with retry logic
			if removeContainerWithRetry(ctx, cli, cont.ID) {
				removed++
			}
		}
	}

	if removed > 0 {
		fmt.Printf("Removed %d test containers\n", removed)
	} else {
		fmt.Println("No test containers found to remove")
	}

	return nil
}

// removeContainerWithRetry attempts to remove a container with exponential backoff retry logic.
func removeContainerWithRetry(ctx context.Context, cli *client.Client, containerID string) bool {
	maxRetries := 3
	baseDelay := 100 * time.Millisecond

	for attempt := range maxRetries {
		err := cli.ContainerRemove(ctx, containerID, container.RemoveOptions{
			Force: true,
		})
		if err == nil {
			return true
		}

		// If this is the last attempt, don't wait
		if attempt == maxRetries-1 {
			break
		}

		// Wait with exponential backoff
		delay := baseDelay * time.Duration(1<<attempt)
		time.Sleep(delay)
	}

	return false
}

// pruneDockerNetworks removes unused Docker networks.
func pruneDockerNetworks(ctx context.Context) error {
	cli, err := createDockerClient()
	if err != nil {
		return fmt.Errorf("failed to create Docker client: %w", err)
	}
	defer cli.Close()

	report, err := cli.NetworksPrune(ctx, filters.Args{})
	if err != nil {
		return fmt.Errorf("failed to prune networks: %w", err)
	}

	if len(report.NetworksDeleted) > 0 {
		fmt.Printf("Removed %d unused networks\n", len(report.NetworksDeleted))
	} else {
		fmt.Println("No unused networks found to remove")
	}

	return nil
}

// cleanOldImages removes test-related and old dangling Docker images.
func cleanOldImages(ctx context.Context) error {
	cli, err := createDockerClient()
	if err != nil {
		return fmt.Errorf("failed to create Docker client: %w", err)
	}
	defer cli.Close()

	images, err := cli.ImageList(ctx, image.ListOptions{
		All: true,
	})
	if err != nil {
		return fmt.Errorf("failed to list images: %w", err)
	}

	removed := 0
	for _, img := range images {
		shouldRemove := false
		for _, tag := range img.RepoTags {
			if strings.Contains(tag, "hs-") ||
				strings.Contains(tag, "headscale-integration") ||
				strings.Contains(tag, "tailscale") {
				shouldRemove = true
				break
			}
		}

		if len(img.RepoTags) == 0 && time.Unix(img.Created, 0).Before(time.Now().Add(-7*24*time.Hour)) {
			shouldRemove = true
		}

		if shouldRemove {
			_, err := cli.ImageRemove(ctx, img.ID, image.RemoveOptions{
				Force: true,
			})
			if err == nil {
				removed++
			}
		}
	}

	if removed > 0 {
		fmt.Printf("Removed %d test images\n", removed)
	} else {
		fmt.Println("No test images found to remove")
	}

	return nil
}

// cleanCacheVolume removes the Docker volume used for Go module cache.
func cleanCacheVolume(ctx context.Context) error {
	cli, err := createDockerClient()
	if err != nil {
		return fmt.Errorf("failed to create Docker client: %w", err)
	}
	defer cli.Close()

	volumeName := "hs-integration-go-cache"
	err = cli.VolumeRemove(ctx, volumeName, true)
	if err != nil {
		if errdefs.IsNotFound(err) {
			fmt.Printf("Go module cache volume not found: %s\n", volumeName)
		} else if errdefs.IsConflict(err) {
			fmt.Printf("Go module cache volume is in use and cannot be removed: %s\n", volumeName)
		} else {
			fmt.Printf("Failed to remove Go module cache volume %s: %v\n", volumeName, err)
		}
	} else {
		fmt.Printf("Removed Go module cache volume: %s\n", volumeName)
	}

	return nil
}
