# Publishing Guide

This document explains how to set up and use automatic publishing for code-server.

## Overview

The project includes automatic publishing workflows that handle:
- Building and testing the project
- Publishing to npm
- Creating GitHub releases
- Building and pushing Docker images

## Setup

### 1. Required Secrets

Configure the following secrets in your GitHub repository:

#### NPM Publishing
- `NPM_TOKEN`: Your npm authentication token
  - Get it from: https://www.npmjs.com/settings/tokens
  - Needs "Automation" access for publishing

#### Docker Publishing
- `DOCKER_USERNAME`: Your Docker Hub username
- `DOCKER_PASSWORD`: Your Docker Hub password or access token

### 2. GitHub Actions Permissions

Ensure the following permissions are enabled in your repository:
- Contents: write (for creating releases)
- Packages: write (for publishing packages)
- Actions: read (for workflow execution)

## Usage

### Automatic Publishing

Publishing happens automatically when you push a version tag:

```bash
# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0
```

The workflow will automatically:
1. Build and test the project
2. Publish to npm
3. Create a GitHub release
4. Build and push Docker images

### Manual Publishing

You can also trigger publishing manually:

1. Go to the "Actions" tab in your GitHub repository
2. Select "Auto Publish" workflow
3. Click "Run workflow"
4. Enter the version (e.g., v1.0.0)
5. Click "Run workflow"

### Using the Release Script

For convenience, use the included release script:

```bash
# Dry run to see what would happen
./scripts/release.sh v1.0.0 --dry-run

# Create a release
./scripts/release.sh v1.0.0

# Skip tests (if you're confident)
./scripts/release.sh v1.0.0 --skip-tests

# Skip build (if already built)
./scripts/release.sh v1.0.0 --skip-build
```

## Workflow Details

### Build and Test Job
- Runs on Ubuntu latest
- Installs dependencies (skipping VS Code submodule deps to avoid kerberos issues)
- Builds the project
- Runs unit tests
- Creates release package
- Uploads build artifacts

### NPM Publishing Job
- Downloads build artifacts
- Publishes to npm registry
- Uses the version from the tag

### GitHub Release Job
- Creates a GitHub release
- Includes release notes
- Attaches the release package
- Marks as prerelease for beta/alpha versions

### Docker Publishing Job
- Builds multi-architecture Docker images (linux/amd64, linux/arm64)
- Pushes to both Docker Hub and GitHub Container Registry
- Tags with version and latest

## Version Format

Versions should follow semantic versioning:
- `v1.0.0` - Stable release
- `v1.0.0-beta` - Beta release
- `v1.0.0-alpha` - Alpha release
- `v1.0.0-rc1` - Release candidate

## Troubleshooting

### Build Failures
- Check that all dependencies are properly installed
- Ensure the kerberos issue is resolved (VS Code submodule deps are skipped)
- Verify Node.js version compatibility

### NPM Publishing Failures
- Verify NPM_TOKEN is correctly set
- Check that the version doesn't already exist on npm
- Ensure the package name is available

### Docker Publishing Failures
- Verify Docker credentials are correct
- Check that the Dockerfile builds successfully
- Ensure multi-architecture builds are supported

### GitHub Release Failures
- Verify GITHUB_TOKEN has sufficient permissions
- Check that the tag doesn't already exist
- Ensure the release package was created successfully

## Monitoring

Monitor the publishing process:
1. Go to the "Actions" tab in your GitHub repository
2. Look for the "Auto Publish" workflow
3. Check individual job logs for detailed information

## Rollback

If a release needs to be rolled back:
1. Unpublish the npm package (if within 72 hours)
2. Delete the GitHub release
3. Delete the Docker images
4. Delete the git tag

```bash
# Delete local and remote tag
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0
```
