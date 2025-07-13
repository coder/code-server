package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os/exec"
	"strings"
)

var ErrSystemChecksFailed = errors.New("system checks failed")

// DoctorResult represents the result of a single health check.
type DoctorResult struct {
	Name        string
	Status      string // "PASS", "FAIL", "WARN"
	Message     string
	Suggestions []string
}

// runDoctorCheck performs comprehensive pre-flight checks for integration testing.
func runDoctorCheck(ctx context.Context) error {
	results := []DoctorResult{}

	// Check 1: Docker binary availability
	results = append(results, checkDockerBinary())

	// Check 2: Docker daemon connectivity
	dockerResult := checkDockerDaemon(ctx)
	results = append(results, dockerResult)

	// If Docker is available, run additional checks
	if dockerResult.Status == "PASS" {
		results = append(results, checkDockerContext(ctx))
		results = append(results, checkDockerSocket(ctx))
		results = append(results, checkGolangImage(ctx))
	}

	// Check 3: Go installation
	results = append(results, checkGoInstallation())

	// Check 4: Git repository
	results = append(results, checkGitRepository())

	// Check 5: Required files
	results = append(results, checkRequiredFiles())

	// Display results
	displayDoctorResults(results)

	// Return error if any critical checks failed
	for _, result := range results {
		if result.Status == "FAIL" {
			return fmt.Errorf("%w - see details above", ErrSystemChecksFailed)
		}
	}

	log.Printf("✅ All system checks passed - ready to run integration tests!")

	return nil
}

// checkDockerBinary verifies Docker binary is available.
func checkDockerBinary() DoctorResult {
	_, err := exec.LookPath("docker")
	if err != nil {
		return DoctorResult{
			Name:    "Docker Binary",
			Status:  "FAIL",
			Message: "Docker binary not found in PATH",
			Suggestions: []string{
				"Install Docker: https://docs.docker.com/get-docker/",
				"For macOS: consider using colima or Docker Desktop",
				"Ensure docker is in your PATH",
			},
		}
	}

	return DoctorResult{
		Name:    "Docker Binary",
		Status:  "PASS",
		Message: "Docker binary found",
	}
}

// checkDockerDaemon verifies Docker daemon is running and accessible.
func checkDockerDaemon(ctx context.Context) DoctorResult {
	cli, err := createDockerClient()
	if err != nil {
		return DoctorResult{
			Name:    "Docker Daemon",
			Status:  "FAIL",
			Message: fmt.Sprintf("Cannot create Docker client: %v", err),
			Suggestions: []string{
				"Start Docker daemon/service",
				"Check Docker Desktop is running (if using Docker Desktop)",
				"For colima: run 'colima start'",
				"Verify DOCKER_HOST environment variable if set",
			},
		}
	}
	defer cli.Close()

	_, err = cli.Ping(ctx)
	if err != nil {
		return DoctorResult{
			Name:    "Docker Daemon",
			Status:  "FAIL",
			Message: fmt.Sprintf("Cannot ping Docker daemon: %v", err),
			Suggestions: []string{
				"Ensure Docker daemon is running",
				"Check Docker socket permissions",
				"Try: docker info",
			},
		}
	}

	return DoctorResult{
		Name:    "Docker Daemon",
		Status:  "PASS",
		Message: "Docker daemon is running and accessible",
	}
}

// checkDockerContext verifies Docker context configuration.
func checkDockerContext(_ context.Context) DoctorResult {
	contextInfo, err := getCurrentDockerContext()
	if err != nil {
		return DoctorResult{
			Name:    "Docker Context",
			Status:  "WARN",
			Message: "Could not detect Docker context, using default settings",
			Suggestions: []string{
				"Check: docker context ls",
				"Consider setting up a specific context if needed",
			},
		}
	}

	if contextInfo == nil {
		return DoctorResult{
			Name:    "Docker Context",
			Status:  "PASS",
			Message: "Using default Docker context",
		}
	}

	return DoctorResult{
		Name:    "Docker Context",
		Status:  "PASS",
		Message: "Using Docker context: " + contextInfo.Name,
	}
}

// checkDockerSocket verifies Docker socket accessibility.
func checkDockerSocket(ctx context.Context) DoctorResult {
	cli, err := createDockerClient()
	if err != nil {
		return DoctorResult{
			Name:    "Docker Socket",
			Status:  "FAIL",
			Message: fmt.Sprintf("Cannot access Docker socket: %v", err),
			Suggestions: []string{
				"Check Docker socket permissions",
				"Add user to docker group: sudo usermod -aG docker $USER",
				"For colima: ensure socket is accessible",
			},
		}
	}
	defer cli.Close()

	info, err := cli.Info(ctx)
	if err != nil {
		return DoctorResult{
			Name:    "Docker Socket",
			Status:  "FAIL",
			Message: fmt.Sprintf("Cannot get Docker info: %v", err),
			Suggestions: []string{
				"Check Docker daemon status",
				"Verify socket permissions",
			},
		}
	}

	return DoctorResult{
		Name:    "Docker Socket",
		Status:  "PASS",
		Message: fmt.Sprintf("Docker socket accessible (Server: %s)", info.ServerVersion),
	}
}

// checkGolangImage verifies we can access the golang Docker image.
func checkGolangImage(ctx context.Context) DoctorResult {
	cli, err := createDockerClient()
	if err != nil {
		return DoctorResult{
			Name:    "Golang Image",
			Status:  "FAIL",
			Message: "Cannot create Docker client for image check",
		}
	}
	defer cli.Close()

	goVersion := detectGoVersion()
	imageName := "golang:" + goVersion

	// Check if we can pull the image
	err = ensureImageAvailable(ctx, cli, imageName, false)
	if err != nil {
		return DoctorResult{
			Name:    "Golang Image",
			Status:  "FAIL",
			Message: fmt.Sprintf("Cannot pull golang image %s: %v", imageName, err),
			Suggestions: []string{
				"Check internet connectivity",
				"Verify Docker Hub access",
				"Try: docker pull " + imageName,
			},
		}
	}

	return DoctorResult{
		Name:    "Golang Image",
		Status:  "PASS",
		Message: fmt.Sprintf("Golang image %s is available", imageName),
	}
}

// checkGoInstallation verifies Go is installed and working.
func checkGoInstallation() DoctorResult {
	_, err := exec.LookPath("go")
	if err != nil {
		return DoctorResult{
			Name:    "Go Installation",
			Status:  "FAIL",
			Message: "Go binary not found in PATH",
			Suggestions: []string{
				"Install Go: https://golang.org/dl/",
				"Ensure go is in your PATH",
			},
		}
	}

	cmd := exec.Command("go", "version")
	output, err := cmd.Output()
	if err != nil {
		return DoctorResult{
			Name:    "Go Installation",
			Status:  "FAIL",
			Message: fmt.Sprintf("Cannot get Go version: %v", err),
		}
	}

	version := strings.TrimSpace(string(output))

	return DoctorResult{
		Name:    "Go Installation",
		Status:  "PASS",
		Message: version,
	}
}

// checkGitRepository verifies we're in a git repository.
func checkGitRepository() DoctorResult {
	cmd := exec.Command("git", "rev-parse", "--git-dir")
	err := cmd.Run()
	if err != nil {
		return DoctorResult{
			Name:    "Git Repository",
			Status:  "FAIL",
			Message: "Not in a Git repository",
			Suggestions: []string{
				"Run from within the headscale git repository",
				"Clone the repository: git clone https://github.com/juanfont/headscale.git",
			},
		}
	}

	return DoctorResult{
		Name:    "Git Repository",
		Status:  "PASS",
		Message: "Running in Git repository",
	}
}

// checkRequiredFiles verifies required files exist.
func checkRequiredFiles() DoctorResult {
	requiredFiles := []string{
		"go.mod",
		"integration/",
		"cmd/hi/",
	}

	var missingFiles []string
	for _, file := range requiredFiles {
		cmd := exec.Command("test", "-e", file)
		if err := cmd.Run(); err != nil {
			missingFiles = append(missingFiles, file)
		}
	}

	if len(missingFiles) > 0 {
		return DoctorResult{
			Name:    "Required Files",
			Status:  "FAIL",
			Message: "Missing required files: " + strings.Join(missingFiles, ", "),
			Suggestions: []string{
				"Ensure you're in the headscale project root directory",
				"Check that integration/ directory exists",
				"Verify this is a complete headscale repository",
			},
		}
	}

	return DoctorResult{
		Name:    "Required Files",
		Status:  "PASS",
		Message: "All required files found",
	}
}

// displayDoctorResults shows the results in a formatted way.
func displayDoctorResults(results []DoctorResult) {
	log.Printf("🔍 System Health Check Results")
	log.Printf("================================")

	for _, result := range results {
		var icon string
		switch result.Status {
		case "PASS":
			icon = "✅"
		case "WARN":
			icon = "⚠️"
		case "FAIL":
			icon = "❌"
		default:
			icon = "❓"
		}

		log.Printf("%s %s: %s", icon, result.Name, result.Message)

		if len(result.Suggestions) > 0 {
			for _, suggestion := range result.Suggestions {
				log.Printf("   💡 %s", suggestion)
			}
		}
	}

	log.Printf("================================")
}
