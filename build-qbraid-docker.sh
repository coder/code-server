#!/bin/bash
set -euo pipefail

# QBraid Code-Server Docker Build Script
echo "=== QBraid Code-Server Docker Build Script ==="

# Configuration
REGISTRY="us-central1-docker.pkg.dev/qbraid-lab-gke/staging-qbraid"
IMAGE_NAME="lab-code-server"
TAG=${1:-latest}
FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}:${TAG}"
PLATFORM="linux/amd64"

echo "Building image: ${FULL_IMAGE_NAME}"
echo "Target platform: ${PLATFORM}"

# Check if logo-square.png exists
if [ ! -f "logo-square.png" ]; then
    echo "⚠️  Warning: logo-square.png not found!"
    echo "   Please add your QBraid logo file as 'logo-square.png' in this directory."
    echo "   The build will continue, but the default favicon will be used."
    echo ""

    # Create a temporary placeholder file to avoid Docker COPY errors
    touch logo-square.png.placeholder
fi

# Check if extensions directory exists and has VSIX files
if [ ! -d "extensions" ] || [ -z "$(find extensions -name "*.vsix" -type f)" ]; then
    echo "⚠️  Warning: No QBraid extensions found!"
    echo "   Expected VSIX files in the 'extensions/' directory."
    echo "   The build will continue, but QBraid extensions won't be pre-installed."
    echo ""

    # Create placeholder extensions directory to avoid Docker COPY errors
    mkdir -p extensions
    touch extensions/.placeholder
else
    echo "✅ Found QBraid extensions:"
    find extensions -name "*.vsix" -type f -exec basename {} \;
    echo ""
fi

# Function to cleanup
cleanup() {
    if [ -f "logo-square.png.placeholder" ]; then
        rm -f logo-square.png.placeholder
    fi
    if [ -f "extensions/.placeholder" ]; then
        rm -f extensions/.placeholder
        if [ -d "extensions" ] && [ -z "$(ls -A extensions)" ]; then
            rmdir extensions
        fi
    fi
}
trap cleanup EXIT

echo "Step 1: Building custom QBraid Docker image..."
echo "Using simplified approach - layering customizations on existing code-server image"

# Ensure buildx is available and create builder if needed
echo "Setting up Docker buildx..."
docker buildx inspect qbraid-builder >/dev/null 2>&1 || docker buildx create --name qbraid-builder --use
docker buildx use qbraid-builder

# Build the custom Docker image with specific platform
echo "Building for platform: ${PLATFORM}"
docker buildx build --load \
    --platform="${PLATFORM}" \
    -f Dockerfile.qbraid \
    -t "${FULL_IMAGE_NAME}" \
    --load \
    .

echo "✅ Docker image built successfully: ${FULL_IMAGE_NAME}"

# Ask user if they want to push
read -p "Do you want to push the image to Google Cloud Artifact Registry? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Step 2: Pushing to Google Cloud Artifact Registry..."

    # Check if user is authenticated
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
        echo "❌ Error: Not authenticated with Google Cloud"
        echo "   Please run: gcloud auth login"
        exit 1
    fi

    # Configure Docker for Artifact Registry
    gcloud auth configure-docker us-central1-docker.pkg.dev --quiet

    # Push the image
    docker push "${FULL_IMAGE_NAME}"

    echo "✅ Image pushed successfully!"
    echo "🚀 Your custom QBraid Code-Server is now available at:"
    echo "   ${FULL_IMAGE_NAME}"
else
    echo "Skipping push. You can push later with:"
    echo "   docker push ${FULL_IMAGE_NAME}"
fi

echo ""
echo "=== Build Complete ==="
echo "To run the container locally (no password required):"
echo "   docker run -it --rm -p 8080:8080 ${FULL_IMAGE_NAME}"
echo "   Then open: http://localhost:8080"
echo ""
echo "To use in Kubernetes:"
echo "   image: ${FULL_IMAGE_NAME}"
echo ""
echo "Platform built for: ${PLATFORM}"
echo "Features included in your custom build:"
echo "   • No authentication required - direct access to code-server"
echo "   • Custom QBraid favicon (if logo-square.png was provided)"
echo "   • Pre-configured VS Code settings optimized for development"
echo "   • Pre-installed QBraid extensions (if VSIX files were provided)"
echo "   • Python development environment"
echo "   • Disabled telemetry and auto-updates"
echo ""
echo "This build uses the official code-server image as a base and layers"
echo "your QBraid customizations on top for reliability and simplicity."