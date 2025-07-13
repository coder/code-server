package dockertestutil

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/juanfont/headscale/hscontrol/util"
	"github.com/ory/dockertest/v3"
)

// GetIntegrationRunID returns the run ID for the current integration test session.
// This is set by the hi tool and passed through environment variables.
func GetIntegrationRunID() string {
	return os.Getenv("HEADSCALE_INTEGRATION_RUN_ID")
}

// DockerAddIntegrationLabels adds integration test labels to Docker RunOptions.
// This allows the hi tool to identify containers belonging to specific test runs.
// This function should be called before passing RunOptions to dockertest functions.
func DockerAddIntegrationLabels(opts *dockertest.RunOptions, testType string) {
	runID := GetIntegrationRunID()
	if runID == "" {
		panic("HEADSCALE_INTEGRATION_RUN_ID environment variable is required")
	}

	if opts.Labels == nil {
		opts.Labels = make(map[string]string)
	}
	opts.Labels["hi.run-id"] = runID
	opts.Labels["hi.test-type"] = testType
}

// GenerateRunID creates a unique run identifier with timestamp and random hash.
// Format: YYYYMMDD-HHMMSS-HASH (e.g., 20250619-143052-a1b2c3).
func GenerateRunID() string {
	now := time.Now()
	timestamp := now.Format("20060102-150405")

	// Add a short random hash to ensure uniqueness
	randomHash := util.MustGenerateRandomStringDNSSafe(6)

	return fmt.Sprintf("%s-%s", timestamp, randomHash)
}

// ExtractRunIDFromContainerName extracts the run ID from container name.
// Expects format: "prefix-YYYYMMDD-HHMMSS-HASH".
func ExtractRunIDFromContainerName(containerName string) string {
	parts := strings.Split(containerName, "-")
	if len(parts) >= 3 {
		// Return the last three parts as the run ID (YYYYMMDD-HHMMSS-HASH)
		return strings.Join(parts[len(parts)-3:], "-")
	}

	panic("unexpected container name format: " + containerName)
}

// IsRunningInContainer checks if the current process is running inside a Docker container.
// This is used by tests to determine if they should run integration tests.
func IsRunningInContainer() bool {
	// Check for the common indicator that we're in a container
	// This could be improved with more robust detection if needed
	_, err := os.Stat("/.dockerenv")
	return err == nil
}
