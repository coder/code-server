package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/api/types/mount"
	"github.com/docker/docker/client"
	"github.com/docker/docker/pkg/stdcopy"
	"github.com/juanfont/headscale/integration/dockertestutil"
)

var (
	ErrTestFailed              = errors.New("test failed")
	ErrUnexpectedContainerWait = errors.New("unexpected end of container wait")
	ErrNoDockerContext         = errors.New("no docker context found")
)

// runTestContainer executes integration tests in a Docker container.
func runTestContainer(ctx context.Context, config *RunConfig) error {
	cli, err := createDockerClient()
	if err != nil {
		return fmt.Errorf("failed to create Docker client: %w", err)
	}
	defer cli.Close()

	runID := dockertestutil.GenerateRunID()
	containerName := "headscale-test-suite-" + runID
	logsDir := filepath.Join(config.LogsDir, runID)

	if config.Verbose {
		log.Printf("Run ID: %s", runID)
		log.Printf("Container name: %s", containerName)
		log.Printf("Logs directory: %s", logsDir)
	}

	absLogsDir, err := filepath.Abs(logsDir)
	if err != nil {
		return fmt.Errorf("failed to get absolute path for logs directory: %w", err)
	}

	const dirPerm = 0o755
	if err := os.MkdirAll(absLogsDir, dirPerm); err != nil {
		return fmt.Errorf("failed to create logs directory: %w", err)
	}

	if config.CleanBefore {
		if config.Verbose {
			log.Printf("Running pre-test cleanup...")
		}
		if err := cleanupBeforeTest(ctx); err != nil && config.Verbose {
			log.Printf("Warning: pre-test cleanup failed: %v", err)
		}
	}

	goTestCmd := buildGoTestCommand(config)
	if config.Verbose {
		log.Printf("Command: %s", strings.Join(goTestCmd, " "))
	}

	imageName := "golang:" + config.GoVersion
	if err := ensureImageAvailable(ctx, cli, imageName, config.Verbose); err != nil {
		return fmt.Errorf("failed to ensure image availability: %w", err)
	}

	resp, err := createGoTestContainer(ctx, cli, config, containerName, absLogsDir, goTestCmd)
	if err != nil {
		return fmt.Errorf("failed to create container: %w", err)
	}

	if config.Verbose {
		log.Printf("Created container: %s", resp.ID)
	}

	if err := cli.ContainerStart(ctx, resp.ID, container.StartOptions{}); err != nil {
		return fmt.Errorf("failed to start container: %w", err)
	}

	log.Printf("Starting test: %s", config.TestPattern)

	exitCode, err := streamAndWait(ctx, cli, resp.ID)

	// Ensure all containers have finished and logs are flushed before extracting artifacts
	if waitErr := waitForContainerFinalization(ctx, cli, resp.ID, config.Verbose); waitErr != nil && config.Verbose {
		log.Printf("Warning: failed to wait for container finalization: %v", waitErr)
	}

	// Extract artifacts from test containers before cleanup
	if err := extractArtifactsFromContainers(ctx, resp.ID, logsDir, config.Verbose); err != nil && config.Verbose {
		log.Printf("Warning: failed to extract artifacts from containers: %v", err)
	}

	// Always list control files regardless of test outcome
	listControlFiles(logsDir)

	shouldCleanup := config.CleanAfter && (!config.KeepOnFailure || exitCode == 0)
	if shouldCleanup {
		if config.Verbose {
			log.Printf("Running post-test cleanup...")
		}
		if cleanErr := cleanupAfterTest(ctx, cli, resp.ID); cleanErr != nil && config.Verbose {
			log.Printf("Warning: post-test cleanup failed: %v", cleanErr)
		}
	}

	if err != nil {
		return fmt.Errorf("test execution failed: %w", err)
	}

	if exitCode != 0 {
		return fmt.Errorf("%w: exit code %d", ErrTestFailed, exitCode)
	}

	log.Printf("Test completed successfully!")

	return nil
}

// buildGoTestCommand constructs the go test command arguments.
func buildGoTestCommand(config *RunConfig) []string {
	cmd := []string{"go", "test", "./..."}

	if config.TestPattern != "" {
		cmd = append(cmd, "-run", config.TestPattern)
	}

	if config.FailFast {
		cmd = append(cmd, "-failfast")
	}

	cmd = append(cmd, "-timeout", config.Timeout.String())
	cmd = append(cmd, "-v")

	return cmd
}

// createGoTestContainer creates a Docker container configured for running integration tests.
func createGoTestContainer(ctx context.Context, cli *client.Client, config *RunConfig, containerName, logsDir string, goTestCmd []string) (container.CreateResponse, error) {
	pwd, err := os.Getwd()
	if err != nil {
		return container.CreateResponse{}, fmt.Errorf("failed to get working directory: %w", err)
	}

	projectRoot := findProjectRoot(pwd)

	runID := dockertestutil.ExtractRunIDFromContainerName(containerName)

	env := []string{
		fmt.Sprintf("HEADSCALE_INTEGRATION_POSTGRES=%d", boolToInt(config.UsePostgres)),
		"HEADSCALE_INTEGRATION_RUN_ID=" + runID,
	}
	containerConfig := &container.Config{
		Image:      "golang:" + config.GoVersion,
		Cmd:        goTestCmd,
		Env:        env,
		WorkingDir: projectRoot + "/integration",
		Tty:        true,
		Labels: map[string]string{
			"hi.run-id":    runID,
			"hi.test-type": "test-runner",
		},
	}

	// Get the correct Docker socket path from the current context
	dockerSocketPath := getDockerSocketPath()

	if config.Verbose {
		log.Printf("Using Docker socket: %s", dockerSocketPath)
	}

	hostConfig := &container.HostConfig{
		AutoRemove: false, // We'll remove manually for better control
		Binds: []string{
			fmt.Sprintf("%s:%s", projectRoot, projectRoot),
			dockerSocketPath + ":/var/run/docker.sock",
			logsDir + ":/tmp/control",
		},
		Mounts: []mount.Mount{
			{
				Type:   mount.TypeVolume,
				Source: "hs-integration-go-cache",
				Target: "/go",
			},
		},
	}

	return cli.ContainerCreate(ctx, containerConfig, hostConfig, nil, nil, containerName)
}

// streamAndWait streams container output and waits for completion.
func streamAndWait(ctx context.Context, cli *client.Client, containerID string) (int, error) {
	out, err := cli.ContainerLogs(ctx, containerID, container.LogsOptions{
		ShowStdout: true,
		ShowStderr: true,
		Follow:     true,
	})
	if err != nil {
		return -1, fmt.Errorf("failed to get container logs: %w", err)
	}
	defer out.Close()

	go func() {
		_, _ = io.Copy(os.Stdout, out)
	}()

	statusCh, errCh := cli.ContainerWait(ctx, containerID, container.WaitConditionNotRunning)
	select {
	case err := <-errCh:
		if err != nil {
			return -1, fmt.Errorf("error waiting for container: %w", err)
		}
	case status := <-statusCh:
		return int(status.StatusCode), nil
	}

	return -1, ErrUnexpectedContainerWait
}

// waitForContainerFinalization ensures all test containers have properly finished and flushed their output.
func waitForContainerFinalization(ctx context.Context, cli *client.Client, testContainerID string, verbose bool) error {
	// First, get all related test containers
	containers, err := cli.ContainerList(ctx, container.ListOptions{All: true})
	if err != nil {
		return fmt.Errorf("failed to list containers: %w", err)
	}

	testContainers := getCurrentTestContainers(containers, testContainerID, verbose)

	// Wait for all test containers to reach a final state
	maxWaitTime := 10 * time.Second
	checkInterval := 500 * time.Millisecond
	timeout := time.After(maxWaitTime)
	ticker := time.NewTicker(checkInterval)
	defer ticker.Stop()

	for {
		select {
		case <-timeout:
			if verbose {
				log.Printf("Timeout waiting for container finalization, proceeding with artifact extraction")
			}
			return nil
		case <-ticker.C:
			allFinalized := true

			for _, testCont := range testContainers {
				inspect, err := cli.ContainerInspect(ctx, testCont.ID)
				if err != nil {
					if verbose {
						log.Printf("Warning: failed to inspect container %s: %v", testCont.name, err)
					}
					continue
				}

				// Check if container is in a final state
				if !isContainerFinalized(inspect.State) {
					allFinalized = false
					if verbose {
						log.Printf("Container %s still finalizing (state: %s)", testCont.name, inspect.State.Status)
					}

					break
				}
			}

			if allFinalized {
				if verbose {
					log.Printf("All test containers finalized, ready for artifact extraction")
				}
				return nil
			}
		}
	}
}

// isContainerFinalized checks if a container has reached a final state where logs are flushed.
func isContainerFinalized(state *container.State) bool {
	// Container is finalized if it's not running and has a finish time
	return !state.Running && state.FinishedAt != ""
}

// findProjectRoot locates the project root by finding the directory containing go.mod.
func findProjectRoot(startPath string) string {
	current := startPath
	for {
		if _, err := os.Stat(filepath.Join(current, "go.mod")); err == nil {
			return current
		}
		parent := filepath.Dir(current)
		if parent == current {
			return startPath
		}
		current = parent
	}
}

// boolToInt converts a boolean to an integer for environment variables.
func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}

// DockerContext represents Docker context information.
type DockerContext struct {
	Name      string                 `json:"Name"`
	Metadata  map[string]interface{} `json:"Metadata"`
	Endpoints map[string]interface{} `json:"Endpoints"`
	Current   bool                   `json:"Current"`
}

// createDockerClient creates a Docker client with context detection.
func createDockerClient() (*client.Client, error) {
	contextInfo, err := getCurrentDockerContext()
	if err != nil {
		return client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	}

	var clientOpts []client.Opt
	clientOpts = append(clientOpts, client.WithAPIVersionNegotiation())

	if contextInfo != nil {
		if endpoints, ok := contextInfo.Endpoints["docker"]; ok {
			if endpointMap, ok := endpoints.(map[string]interface{}); ok {
				if host, ok := endpointMap["Host"].(string); ok {
					if runConfig.Verbose {
						log.Printf("Using Docker host from context '%s': %s", contextInfo.Name, host)
					}
					clientOpts = append(clientOpts, client.WithHost(host))
				}
			}
		}
	}

	if len(clientOpts) == 1 {
		clientOpts = append(clientOpts, client.FromEnv)
	}

	return client.NewClientWithOpts(clientOpts...)
}

// getCurrentDockerContext retrieves the current Docker context information.
func getCurrentDockerContext() (*DockerContext, error) {
	cmd := exec.Command("docker", "context", "inspect")
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to get docker context: %w", err)
	}

	var contexts []DockerContext
	if err := json.Unmarshal(output, &contexts); err != nil {
		return nil, fmt.Errorf("failed to parse docker context: %w", err)
	}

	if len(contexts) > 0 {
		return &contexts[0], nil
	}

	return nil, ErrNoDockerContext
}

// getDockerSocketPath returns the correct Docker socket path for the current context.
func getDockerSocketPath() string {
	// Always use the default socket path for mounting since Docker handles
	// the translation to the actual socket (e.g., colima socket) internally
	return "/var/run/docker.sock"
}

// ensureImageAvailable pulls the specified Docker image to ensure it's available.
func ensureImageAvailable(ctx context.Context, cli *client.Client, imageName string, verbose bool) error {
	if verbose {
		log.Printf("Pulling image %s...", imageName)
	}

	reader, err := cli.ImagePull(ctx, imageName, image.PullOptions{})
	if err != nil {
		return fmt.Errorf("failed to pull image %s: %w", imageName, err)
	}
	defer reader.Close()

	if verbose {
		_, err = io.Copy(os.Stdout, reader)
		if err != nil {
			return fmt.Errorf("failed to read pull output: %w", err)
		}
	} else {
		_, err = io.Copy(io.Discard, reader)
		if err != nil {
			return fmt.Errorf("failed to read pull output: %w", err)
		}
		log.Printf("Image %s pulled successfully", imageName)
	}

	return nil
}

// listControlFiles displays the headscale test artifacts created in the control logs directory.
func listControlFiles(logsDir string) {
	entries, err := os.ReadDir(logsDir)
	if err != nil {
		log.Printf("Logs directory: %s", logsDir)
		return
	}

	var logFiles []string
	var dataFiles []string
	var dataDirs []string

	for _, entry := range entries {
		name := entry.Name()
		// Only show headscale (hs-*) files and directories
		if !strings.HasPrefix(name, "hs-") {
			continue
		}

		if entry.IsDir() {
			// Include directories (pprof, mapresponses)
			if strings.Contains(name, "-pprof") || strings.Contains(name, "-mapresponses") {
				dataDirs = append(dataDirs, name)
			}
		} else {
			// Include files
			switch {
			case strings.HasSuffix(name, ".stderr.log") || strings.HasSuffix(name, ".stdout.log"):
				logFiles = append(logFiles, name)
			case strings.HasSuffix(name, ".db"):
				dataFiles = append(dataFiles, name)
			}
		}
	}

	log.Printf("Test artifacts saved to: %s", logsDir)

	if len(logFiles) > 0 {
		log.Printf("Headscale logs:")
		for _, file := range logFiles {
			log.Printf("  %s", file)
		}
	}

	if len(dataFiles) > 0 || len(dataDirs) > 0 {
		log.Printf("Headscale data:")
		for _, file := range dataFiles {
			log.Printf("  %s", file)
		}
		for _, dir := range dataDirs {
			log.Printf("  %s/", dir)
		}
	}
}

// extractArtifactsFromContainers collects container logs and files from the specific test run.
func extractArtifactsFromContainers(ctx context.Context, testContainerID, logsDir string, verbose bool) error {
	cli, err := createDockerClient()
	if err != nil {
		return fmt.Errorf("failed to create Docker client: %w", err)
	}
	defer cli.Close()

	// List all containers
	containers, err := cli.ContainerList(ctx, container.ListOptions{All: true})
	if err != nil {
		return fmt.Errorf("failed to list containers: %w", err)
	}

	// Get containers from the specific test run
	currentTestContainers := getCurrentTestContainers(containers, testContainerID, verbose)

	extractedCount := 0
	for _, cont := range currentTestContainers {
		// Extract container logs and tar files
		if err := extractContainerArtifacts(ctx, cli, cont.ID, cont.name, logsDir, verbose); err != nil {
			if verbose {
				log.Printf("Warning: failed to extract artifacts from container %s (%s): %v", cont.name, cont.ID[:12], err)
			}
		} else {
			if verbose {
				log.Printf("Extracted artifacts from container %s (%s)", cont.name, cont.ID[:12])
			}
			extractedCount++
		}
	}

	if verbose && extractedCount > 0 {
		log.Printf("Extracted artifacts from %d containers", extractedCount)
	}

	return nil
}

// testContainer represents a container from the current test run.
type testContainer struct {
	ID   string
	name string
}

// getCurrentTestContainers filters containers to only include those from the current test run.
func getCurrentTestContainers(containers []container.Summary, testContainerID string, verbose bool) []testContainer {
	var testRunContainers []testContainer

	// Find the test container to get its run ID label
	var runID string
	for _, cont := range containers {
		if cont.ID == testContainerID {
			if cont.Labels != nil {
				runID = cont.Labels["hi.run-id"]
			}
			break
		}
	}

	if runID == "" {
		log.Printf("Error: test container %s missing required hi.run-id label", testContainerID[:12])
		return testRunContainers
	}

	if verbose {
		log.Printf("Looking for containers with run ID: %s", runID)
	}

	// Find all containers with the same run ID
	for _, cont := range containers {
		for _, name := range cont.Names {
			containerName := strings.TrimPrefix(name, "/")
			if strings.HasPrefix(containerName, "hs-") || strings.HasPrefix(containerName, "ts-") {
				// Check if container has matching run ID label
				if cont.Labels != nil && cont.Labels["hi.run-id"] == runID {
					testRunContainers = append(testRunContainers, testContainer{
						ID:   cont.ID,
						name: containerName,
					})
					if verbose {
						log.Printf("Including container %s (run ID: %s)", containerName, runID)
					}
				}

				break
			}
		}
	}

	return testRunContainers
}

// extractContainerArtifacts saves logs and tar files from a container.
func extractContainerArtifacts(ctx context.Context, cli *client.Client, containerID, containerName, logsDir string, verbose bool) error {
	// Ensure the logs directory exists
	if err := os.MkdirAll(logsDir, 0o755); err != nil {
		return fmt.Errorf("failed to create logs directory: %w", err)
	}

	// Extract container logs
	if err := extractContainerLogs(ctx, cli, containerID, containerName, logsDir, verbose); err != nil {
		return fmt.Errorf("failed to extract logs: %w", err)
	}

	// Extract tar files for headscale containers only
	if strings.HasPrefix(containerName, "hs-") {
		if err := extractContainerFiles(ctx, cli, containerID, containerName, logsDir, verbose); err != nil {
			if verbose {
				log.Printf("Warning: failed to extract files from %s: %v", containerName, err)
			}
			// Don't fail the whole extraction if files are missing
		}
	}

	return nil
}

// extractContainerLogs saves the stdout and stderr logs from a container to files.
func extractContainerLogs(ctx context.Context, cli *client.Client, containerID, containerName, logsDir string, verbose bool) error {
	// Get container logs
	logReader, err := cli.ContainerLogs(ctx, containerID, container.LogsOptions{
		ShowStdout: true,
		ShowStderr: true,
		Timestamps: false,
		Follow:     false,
		Tail:       "all",
	})
	if err != nil {
		return fmt.Errorf("failed to get container logs: %w", err)
	}
	defer logReader.Close()

	// Create log files following the headscale naming convention
	stdoutPath := filepath.Join(logsDir, containerName+".stdout.log")
	stderrPath := filepath.Join(logsDir, containerName+".stderr.log")

	// Create buffers to capture stdout and stderr separately
	var stdoutBuf, stderrBuf bytes.Buffer

	// Demultiplex the Docker logs stream to separate stdout and stderr
	_, err = stdcopy.StdCopy(&stdoutBuf, &stderrBuf, logReader)
	if err != nil {
		return fmt.Errorf("failed to demultiplex container logs: %w", err)
	}

	// Write stdout logs
	if err := os.WriteFile(stdoutPath, stdoutBuf.Bytes(), 0o644); err != nil {
		return fmt.Errorf("failed to write stdout log: %w", err)
	}

	// Write stderr logs
	if err := os.WriteFile(stderrPath, stderrBuf.Bytes(), 0o644); err != nil {
		return fmt.Errorf("failed to write stderr log: %w", err)
	}

	if verbose {
		log.Printf("Saved logs for %s: %s, %s", containerName, stdoutPath, stderrPath)
	}

	return nil
}

// extractContainerFiles extracts database file and directories from headscale containers.
// Note: The actual file extraction is now handled by the integration tests themselves
// via SaveProfile, SaveMapResponses, and SaveDatabase functions in hsic.go.
func extractContainerFiles(ctx context.Context, cli *client.Client, containerID, containerName, logsDir string, verbose bool) error {
	// Files are now extracted directly by the integration tests
	// This function is kept for potential future use or other file types
	return nil
}

// logExtractionError logs extraction errors with appropriate level based on error type.
func logExtractionError(artifactType, containerName string, err error, verbose bool) {
	if errors.Is(err, ErrFileNotFoundInTar) {
		// File not found is expected and only logged in verbose mode
		if verbose {
			log.Printf("No %s found in container %s", artifactType, containerName)
		}
	} else {
		// Other errors are actual failures and should be logged as warnings
		log.Printf("Warning: failed to extract %s from %s: %v", artifactType, containerName, err)
	}
}

// extractSingleFile copies a single file from a container.
func extractSingleFile(ctx context.Context, cli *client.Client, containerID, sourcePath, fileName, logsDir string, verbose bool) error {
	tarReader, _, err := cli.CopyFromContainer(ctx, containerID, sourcePath)
	if err != nil {
		return fmt.Errorf("failed to copy %s from container: %w", sourcePath, err)
	}
	defer tarReader.Close()

	// Extract the single file from the tar
	filePath := filepath.Join(logsDir, fileName)
	if err := extractFileFromTar(tarReader, filepath.Base(sourcePath), filePath); err != nil {
		return fmt.Errorf("failed to extract file from tar: %w", err)
	}

	if verbose {
		log.Printf("Extracted %s from %s", fileName, containerID[:12])
	}

	return nil
}

// extractDirectory copies a directory from a container and extracts its contents.
func extractDirectory(ctx context.Context, cli *client.Client, containerID, sourcePath, dirName, logsDir string, verbose bool) error {
	tarReader, _, err := cli.CopyFromContainer(ctx, containerID, sourcePath)
	if err != nil {
		return fmt.Errorf("failed to copy %s from container: %w", sourcePath, err)
	}
	defer tarReader.Close()

	// Create target directory
	targetDir := filepath.Join(logsDir, dirName)
	if err := os.MkdirAll(targetDir, 0o755); err != nil {
		return fmt.Errorf("failed to create directory %s: %w", targetDir, err)
	}

	// Extract the directory from the tar
	if err := extractDirectoryFromTar(tarReader, targetDir); err != nil {
		return fmt.Errorf("failed to extract directory from tar: %w", err)
	}

	if verbose {
		log.Printf("Extracted %s/ from %s", dirName, containerID[:12])
	}

	return nil
}
