# QBraid Code-Server Custom Build

This guide explains how to build a customized Code-Server Docker image with QBraid branding, custom favicon, pre-configured settings, and QBraid extensions.

## Features

### No Authentication Required
- **Direct access** - No password prompt when accessing code-server
- **Development-friendly** - Perfect for development environments and internal use
- **Optional security** - Can be easily re-enabled if needed for production

### Multi-Platform Build Support
- Uses Docker buildx for cross-platform builds
- Targets `linux/amd64` architecture by default for maximum compatibility
- Works on Apple Silicon Macs, Intel Macs, and Linux development machines

### Custom Favicon
- Replaces all VS Code favicon files with your custom QBraid logo
- Supports PNG format logos (recommended: 512x512 pixels, square format)

### Pre-installed QBraid Extensions
- Automatically installs all VSIX extension files from the `extensions/` directory
- Currently includes:
  - QBraid Environment Manager (`qbraid-environment-manager-0.0.1.vsix`)
  - Quantum Console (`quantum-console-0.2.1.vsix`)
- Extensions are installed during the Docker build process and available immediately

### Pre-configured Settings

**User Settings** (stored in `~/.vscode/User/settings.json`):
- Dark theme by default
- Optimized editor settings (font size, tab settings, word wrap)
- Auto-save enabled
- Git integration configured
- Python development ready
- Modern icon theme

**Machine Settings** (stored in `~/.vscode/Machine/settings.json`):
- Disabled automatic updates
- Telemetry turned off
- Reduced welcome page distractions

### Difference Between User and Machine Settings

- **User Settings**: Per-user preferences that can be overridden by workspace settings
- **Machine Settings**: System-wide settings that take precedence over user settings, typically used for administrative policies

## Prerequisites

1. **Docker with buildx support** (Docker Desktop 19.03+ or Docker CE 20.10+)
2. **Google Cloud CLI** (`gcloud`) installed and configured
3. **Git** with access to this repository
4. **Your custom logo** as `logo-square.png`
5. **QBraid extensions** as VSIX files in the `extensions/` directory

## Quick Start

### 1. Prepare Your Logo

Add your QBraid logo to the root directory:

```bash
# Copy your logo file to the code-server directory
cp /path/to/your/qbraid-logo.png ./logo-square.png
```

**Logo Requirements:**
- Format: PNG
- Recommended size: 512x512 pixels (square)
- File name: `logo-square.png`
- Place in the same directory as this README

### 2. Verify QBraid Extensions

The `extensions/` directory should contain your VSIX files:

```bash
extensions/
├── qbraid-environment-manager-0.0.1.vsix
└── quantum-console-0.2.1.vsix
```

**Extension Requirements:**
- Format: VSIX files (VS Code extension packages)
- Place all extension files in the `extensions/` directory
- Extensions will be automatically installed during the build

### 3. Run the Build Script

```bash
# Build and optionally push to Google Cloud Artifact Registry
./build-qbraid-docker.sh

# Or build with a specific tag
./build-qbraid-docker.sh v1.0.0
```

### 4. What the Script Does

1. **Sets up Docker buildx** - Creates a multi-platform builder if needed
2. **Checks for your logo file** - warns if missing but continues
3. **Checks for QBraid extensions** - lists found VSIX files
4. **Builds for linux/amd64** - ensures compatibility with most cloud environments
5. **Creates custom Docker image** - applies your branding, settings, and extensions
6. **Optionally pushes to registry** - uploads to your Google Cloud Artifact Registry

## Manual Build Process

If you prefer to build manually:

### Step 1: Set up Docker buildx

```bash
# Create a builder instance for multi-platform builds
docker buildx create --name qbraid-builder --use
docker buildx use qbraid-builder
```

### Step 2: Build Custom Image

```bash
# Build the custom QBraid image for linux/amd64
docker buildx build \
  --platform=linux/amd64 \
  -f Dockerfile.qbraid \
  -t us-central1-docker.pkg.dev/qbraid-lab-gke/staging-qbraid/lab-code-server:latest \
  --load \
  .
```

### Step 3: Push to Registry

```bash
# Authenticate with Google Cloud
gcloud auth login
gcloud auth configure-docker us-central1-docker.pkg.dev

# Push the image
docker push us-central1-docker.pkg.dev/qbraid-lab-gke/staging-qbraid/lab-code-server:latest
```

## Testing Locally

Run your custom image locally to test:

```bash
docker run -it --rm -p 8080:8080 \
  us-central1-docker.pkg.dev/qbraid-lab-gke/staging-qbraid/lab-code-server:latest
```

Then open http://localhost:8080 in your browser. **No password required** - you'll go directly to VS Code! Your QBraid extensions should be automatically available in the Extensions panel.

## Using in Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: qbraid-code-server
spec:
  replicas: 1
  selector:
    matchLabels:
      app: qbraid-code-server
  template:
    metadata:
      labels:
        app: qbraid-code-server
    spec:
      containers:
      - name: code-server
        image: us-central1-docker.pkg.dev/qbraid-lab-gke/staging-qbraid/lab-code-server:latest
        ports:
        - containerPort: 8080
        # No PASSWORD environment variable needed - authentication is disabled
```

## Security Configuration

### No Authentication (Default)

By default, this build disables authentication for ease of development use:

- **Environment**: `PASSWORD=""`
- **Startup flag**: `--auth none`
- **Access**: Direct access to VS Code interface

### Enabling Authentication (Optional)

If you need to enable authentication for production use, you can override the default behavior:

#### Option 1: Set PASSWORD environment variable

```bash
# Run with password authentication
docker run -it --rm -p 8080:8080 \
  -e PASSWORD="your-secure-password" \
  us-central1-docker.pkg.dev/qbraid-lab-gke/staging-qbraid/lab-code-server:latest \
  --auth password
```

#### Option 2: Modify the Dockerfile

Edit `Dockerfile.qbraid` and change:

```dockerfile
# Remove or comment out these lines:
ENV PASSWORD=""
ENTRYPOINT ["/usr/bin/entrypoint.sh", "--bind-addr", "0.0.0.0:8080", "--auth", "none", "."]

# Replace with:
ENV PASSWORD="your-default-password"
ENTRYPOINT ["/usr/bin/entrypoint.sh", "--bind-addr", "0.0.0.0:8080", "."]
```

#### Option 3: Kubernetes with authentication

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: qbraid-code-server
spec:
  template:
    spec:
      containers:
      - name: code-server
        image: us-central1-docker.pkg.dev/qbraid-lab-gke/staging-qbraid/lab-code-server:latest
        ports:
        - containerPort: 8080
        env:
        - name: PASSWORD
          value: "your-secure-password"
        args: ["--auth", "password", "."]
```

## Advanced Configuration

### Building for Different Platforms

To build for a different platform, modify the `PLATFORM` variable in the build script:

```bash
# Edit build-qbraid-docker.sh and change:
PLATFORM="linux/arm64"  # For ARM64 servers
# or
PLATFORM="linux/amd64,linux/arm64"  # For multi-arch builds
```

### Multi-Architecture Builds

For true multi-architecture builds that support both AMD64 and ARM64:

```bash
docker buildx build \
  --platform=linux/amd64,linux/arm64 \
  -f Dockerfile.qbraid \
  -t us-central1-docker.pkg.dev/qbraid-lab-gke/staging-qbraid/lab-code-server:latest \
  --push \
  .
```

## Customizing Settings

You can modify the default settings by editing `Dockerfile.qbraid`:

### User Settings Location
Lines 32-48 in `Dockerfile.qbraid` contain the user settings JSON.

### Machine Settings Location
Lines 51-56 in `Dockerfile.qbraid` contain the machine settings JSON.

### Adding More Extensions

To add additional extensions, either:

1. **Add VSIX files** to the `extensions/` directory (recommended)
2. **Install from marketplace** by adding to the Dockerfile:

```dockerfile
RUN code-server --install-extension ms-python.python
RUN code-server --install-extension ms-vscode.vscode-json
```

### Creating VSIX Files

If you have custom extensions to package:

```bash
# Install vsce (VS Code Extension Manager)
npm install -g vsce

# Package your extension
cd your-extension-directory
vsce package

# Copy the generated .vsix file to the extensions directory
cp your-extension-1.0.0.vsix ../code-server/extensions/
```

## Troubleshooting

### Docker Buildx Issues
If you encounter buildx issues:

```bash
# Reset buildx
docker buildx rm qbraid-builder
docker buildx create --name qbraid-builder --use

# Or use default builder
docker buildx use default
```

### Platform Compatibility Issues
If the image doesn't work on your target platform:

1. Verify the target platform: `docker inspect --format='{{.Architecture}}' your-image`
2. Check if your target supports the built architecture
3. Rebuild for the correct platform using the manual build process

### Build Fails with Architecture Errors
On Apple Silicon Macs, if you see architecture warnings:

1. The build script automatically handles this with `--platform=linux/amd64`
2. This ensures compatibility with most Kubernetes clusters
3. The image will work correctly even though built on ARM64

### Authentication Issues

#### Can't Access Code-Server (Stuck on Login)
The image is configured with no authentication by default. If you're seeing a login screen:

1. Check if you're overriding with environment variables
2. Verify the container is using the correct entrypoint
3. Check container logs: `docker logs <container-id>`

#### Want to Add Authentication Back
Follow the [Security Configuration](#security-configuration) section above.

### Logo Not Showing
1. Verify `logo-square.png` exists in the root directory
2. Check the file is a valid PNG format
3. Ensure `.dockerignore` includes `!logo-square.png` (already configured)
4. Rebuild the image after adding the logo

### Extensions Not Loading
1. Verify VSIX files exist in the `extensions/` directory
2. Check that VSIX files are valid (not corrupted)
3. Ensure `.dockerignore` includes `!extensions` (already configured)
4. Look at container logs for extension installation errors
5. Ensure extensions are compatible with the code-server version

### Settings Not Applied
Settings are baked into the image and will be the defaults for new users. Existing user settings in persistent volumes will override these defaults.

### Push Permission Denied
Ensure you're authenticated and have push permissions:

```bash
gcloud auth login
gcloud auth configure-docker us-central1-docker.pkg.dev
```

## File Structure

```
code-server/
├── build-qbraid-docker.sh      # Build script with buildx support
├── Dockerfile.qbraid           # Custom Dockerfile (no auth by default)
├── .dockerignore              # Updated to include extensions and logo
├── logo-square.png            # Your custom logo (you provide)
├── extensions/                # QBraid extensions directory
│   ├── qbraid-environment-manager-0.0.1.vsix
│   └── quantum-console-0.2.1.vsix
├── QBRAID_BUILD_README.md     # This file
└── ... (other code-server files)
```

## Support

For issues specific to the QBraid customizations, check:
1. Logo file exists and is valid PNG
2. Extension VSIX files exist and are valid
3. Docker buildx is properly installed and configured
4. Target platform compatibility
5. Authentication configuration (if login issues occur)
6. Network connectivity for registry push

For general code-server issues, refer to the main code-server documentation.