#!/bin/bash

# Cursor Full Stack AI IDE - Docker Build and Push Script
# This script builds all Docker images and provides instructions for pushing to registries

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
REGISTRY_USERNAME=${REGISTRY_USERNAME:-"your-username"}
REGISTRY_PASSWORD=${REGISTRY_PASSWORD:-""}
REGISTRY_URL=${REGISTRY_URL:-"docker.io"}
IMAGE_PREFIX=${IMAGE_PREFIX:-"cursor-fullstack-ai-ide"}

# Functions
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check if Docker is available
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running"
        exit 1
    fi
    
    log "Docker is available and running"
}

# Build backend image
build_backend() {
    log "Building backend image..."
    
    if docker build -t ${IMAGE_PREFIX}-backend:latest ./packages/backend/claudable; then
        success "Backend image built successfully"
        docker images | grep ${IMAGE_PREFIX}-backend
    else
        error "Failed to build backend image"
        exit 1
    fi
}

# Build frontend image
build_frontend() {
    log "Building frontend image..."
    
    if docker build -t ${IMAGE_PREFIX}-frontend:latest ./packages/frontend/cursor-web; then
        success "Frontend image built successfully"
        docker images | grep ${IMAGE_PREFIX}-frontend
    else
        error "Failed to build frontend image"
        exit 1
    fi
}

# Build complete system image
build_complete() {
    log "Building complete system image..."
    
    # Create Dockerfile.complete if it doesn't exist
    if [ ! -f "Dockerfile.complete" ]; then
        log "Creating Dockerfile.complete..."
        cat > Dockerfile.complete << 'EOF'
FROM nginx:alpine

# Copy built frontend
COPY --from=cursor-fullstack-ai-ide-frontend:latest /usr/share/nginx/html /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Install Node.js and dependencies for backend
RUN apk add --no-cache nodejs npm

# Copy backend
COPY --from=cursor-fullstack-ai-ide-backend:latest /app /app/backend

# Install backend dependencies
WORKDIR /app/backend
RUN npm install --production

# Create startup script
RUN cat > /start.sh << 'SCRIPT'
#!/bin/sh
# Start backend
cd /app/backend && node dist/index.js &
# Start nginx
nginx -g "daemon off;"
SCRIPT

RUN chmod +x /start.sh

EXPOSE 80 3001 8080

CMD ["/start.sh"]
EOF
    fi
    
    if docker build -f Dockerfile.complete -t ${IMAGE_PREFIX}-complete:latest .; then
        success "Complete system image built successfully"
        docker images | grep ${IMAGE_PREFIX}-complete
    else
        error "Failed to build complete system image"
        exit 1
    fi
}

# Tag images for registry
tag_images() {
    log "Tagging images for registry..."
    
    # Tag for Docker Hub
    docker tag ${IMAGE_PREFIX}-backend:latest ${REGISTRY_USERNAME}/${IMAGE_PREFIX}-backend:latest
    docker tag ${IMAGE_PREFIX}-frontend:latest ${REGISTRY_USERNAME}/${IMAGE_PREFIX}-frontend:latest
    docker tag ${IMAGE_PREFIX}-complete:latest ${REGISTRY_USERNAME}/${IMAGE_PREFIX}-complete:latest
    
    # Tag with version
    VERSION=$(date +%Y%m%d-%H%M%S)
    docker tag ${IMAGE_PREFIX}-backend:latest ${REGISTRY_USERNAME}/${IMAGE_PREFIX}-backend:${VERSION}
    docker tag ${IMAGE_PREFIX}-frontend:latest ${REGISTRY_USERNAME}/${IMAGE_PREFIX}-frontend:${VERSION}
    docker tag ${IMAGE_PREFIX}-complete:latest ${REGISTRY_USERNAME}/${IMAGE_PREFIX}-complete:${VERSION}
    
    success "Images tagged successfully"
    log "Version: ${VERSION}"
}

# Login to registry
login_registry() {
    if [ -n "$REGISTRY_PASSWORD" ]; then
        log "Logging in to registry..."
        echo "$REGISTRY_PASSWORD" | docker login ${REGISTRY_URL} -u ${REGISTRY_USERNAME} --password-stdin
        success "Logged in to registry"
    else
        warn "No registry password provided. Skipping login."
        warn "You can login manually with: docker login ${REGISTRY_URL}"
    fi
}

# Push images to registry
push_images() {
    if [ -n "$REGISTRY_PASSWORD" ]; then
        log "Pushing images to registry..."
        
        # Push latest tags
        docker push ${REGISTRY_USERNAME}/${IMAGE_PREFIX}-backend:latest
        docker push ${REGISTRY_USERNAME}/${IMAGE_PREFIX}-frontend:latest
        docker push ${REGISTRY_USERNAME}/${IMAGE_PREFIX}-complete:latest
        
        # Push version tags
        VERSION=$(date +%Y%m%d-%H%M%S)
        docker push ${REGISTRY_USERNAME}/${IMAGE_PREFIX}-backend:${VERSION}
        docker push ${REGISTRY_USERNAME}/${IMAGE_PREFIX}-frontend:${VERSION}
        docker push ${REGISTRY_USERNAME}/${IMAGE_PREFIX}-complete:${VERSION}
        
        success "Images pushed successfully"
        log "Registry: ${REGISTRY_URL}/${REGISTRY_USERNAME}"
        log "Version: ${VERSION}"
    else
        warn "No registry password provided. Skipping push."
        warn "You can push manually with:"
        warn "  docker push ${REGISTRY_USERNAME}/${IMAGE_PREFIX}-backend:latest"
        warn "  docker push ${REGISTRY_USERNAME}/${IMAGE_PREFIX}-frontend:latest"
        warn "  docker push ${REGISTRY_USERNAME}/${IMAGE_PREFIX}-complete:latest"
    fi
}

# Generate pull commands
generate_pull_commands() {
    log "Generating pull commands..."
    
    echo -e "\n${CYAN}=== Docker Pull Commands ===${NC}"
    echo -e "${YELLOW}# Pull latest images${NC}"
    echo "docker pull ${REGISTRY_USERNAME}/${IMAGE_PREFIX}-backend:latest"
    echo "docker pull ${REGISTRY_USERNAME}/${IMAGE_PREFIX}-frontend:latest"
    echo "docker pull ${REGISTRY_USERNAME}/${IMAGE_PREFIX}-complete:latest"
    
    echo -e "\n${YELLOW}# Run complete system${NC}"
    echo "docker run -d -p 80:80 -p 3001:3001 -p 8080:8080 --name cursor-fullstack ${REGISTRY_USERNAME}/${IMAGE_PREFIX}-complete:latest"
    
    echo -e "\n${YELLOW}# Run individual services${NC}"
    echo "docker run -d -p 3001:3001 -p 8080:8080 --name cursor-backend ${REGISTRY_USERNAME}/${IMAGE_PREFIX}-backend:latest"
    echo "docker run -d -p 5173:5173 --name cursor-frontend ${REGISTRY_USERNAME}/${IMAGE_PREFIX}-frontend:latest"
    
    echo -e "\n${CYAN}=== Registry Links ===${NC}"
    echo "Backend: https://${REGISTRY_URL}/${REGISTRY_USERNAME}/${IMAGE_PREFIX}-backend"
    echo "Frontend: https://${REGISTRY_URL}/${REGISTRY_USERNAME}/${IMAGE_PREFIX}-frontend"
    echo "Complete: https://${REGISTRY_URL}/${REGISTRY_USERNAME}/${IMAGE_PREFIX}-complete"
}

# Test images
test_images() {
    log "Testing images..."
    
    # Test backend
    log "Testing backend image..."
    if docker run --rm -d --name test-backend -p 3001:3001 ${IMAGE_PREFIX}-backend:latest; then
        sleep 5
        if curl -f http://localhost:3001/health > /dev/null 2>&1; then
            success "Backend image test passed"
        else
            warn "Backend image test failed - health check not responding"
        fi
        docker stop test-backend > /dev/null 2>&1
    else
        warn "Backend image test failed - container failed to start"
    fi
    
    # Test frontend
    log "Testing frontend image..."
    if docker run --rm -d --name test-frontend -p 5173:5173 ${IMAGE_PREFIX}-frontend:latest; then
        sleep 5
        if curl -f http://localhost:5173 > /dev/null 2>&1; then
            success "Frontend image test passed"
        else
            warn "Frontend image test failed - not responding"
        fi
        docker stop test-frontend > /dev/null 2>&1
    else
        warn "Frontend image test failed - container failed to start"
    fi
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "=========================================="
    echo "  Cursor Full Stack AI IDE"
    echo "  Docker Build and Push Script"
    echo "=========================================="
    echo -e "${NC}"
    
    # Check prerequisites
    check_docker
    
    # Build images
    build_backend
    build_frontend
    build_complete
    
    # Tag images
    tag_images
    
    # Login to registry
    login_registry
    
    # Push images
    push_images
    
    # Test images
    test_images
    
    # Generate pull commands
    generate_pull_commands
    
    echo -e "\n${GREEN}=========================================="
    echo "  Build and Push Complete!"
    echo "=========================================="
    echo -e "${NC}"
    
    success "All Docker images have been built and are ready for use!"
    log "Check the pull commands above to use your images"
    log "Registry: ${REGISTRY_URL}/${REGISTRY_USERNAME}"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --username)
            REGISTRY_USERNAME="$2"
            shift 2
            ;;
        --password)
            REGISTRY_PASSWORD="$2"
            shift 2
            ;;
        --registry)
            REGISTRY_URL="$2"
            shift 2
            ;;
        --prefix)
            IMAGE_PREFIX="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --username USERNAME    Registry username (default: your-username)"
            echo "  --password PASSWORD    Registry password"
            echo "  --registry URL         Registry URL (default: docker.io)"
            echo "  --prefix PREFIX        Image prefix (default: cursor-fullstack-ai-ide)"
            echo "  --help                 Show this help message"
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main function
main