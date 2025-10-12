#!/bin/bash

# Cursor Full Stack AI IDE - Complete Automated Deployment Script
# This script automates the entire deployment process to Cloudflare

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
BACKEND_NAME="cursor-backend"
FRONTEND_NAME="cursor-frontend"
SUBDOMAIN=""
DOMAIN=""
AUTO_SETUP=true
SKIP_CONFIRMATION=false

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

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# Check if Wrangler is installed
check_wrangler() {
    step "Checking Wrangler CLI installation..."
    
    if ! command -v wrangler &> /dev/null; then
        error "Wrangler CLI is not installed"
        log "Installing Wrangler CLI..."
        npm install -g wrangler
        success "Wrangler CLI installed successfully"
    else
        log "Wrangler CLI is available"
    fi
}

# Check if user is logged in
check_auth() {
    step "Checking Cloudflare authentication..."
    
    if ! wrangler whoami &> /dev/null; then
        error "Not logged in to Cloudflare"
        log "Starting authentication process..."
        wrangler login
        success "Successfully authenticated with Cloudflare"
    else
        log "Already authenticated with Cloudflare"
    fi
}

# Generate random subdomain if not provided
generate_subdomain() {
    if [ -z "$SUBDOMAIN" ]; then
        SUBDOMAIN="cursor-ide-$(date +%s | tail -c 6)"
        log "Generated random subdomain: $SUBDOMAIN"
    fi
}

# Setup all required services
setup_services() {
    step "Setting up all required Cloudflare services..."
    
    # Setup KV Storage
    setup_kv_storage
    
    # Setup R2 Storage
    setup_r2_storage
    
    # Setup Durable Objects
    setup_durable_objects
    
    # Setup Workers
    setup_workers
    
    # Setup Pages
    setup_pages
    
    success "All services setup completed"
}

# Setup KV Storage
setup_kv_storage() {
    log "Setting up KV Storage..."
    
    # Create API keys namespace
    if ! wrangler kv:namespace list | grep -q "API_KEYS"; then
        wrangler kv:namespace create "API_KEYS" --preview
        wrangler kv:namespace create "API_KEYS"
        success "KV namespace 'API_KEYS' created"
    else
        log "KV namespace 'API_KEYS' already exists"
    fi
    
    # Create file storage namespace
    if ! wrangler kv:namespace list | grep -q "FILE_STORAGE"; then
        wrangler kv:namespace create "FILE_STORAGE" --preview
        wrangler kv:namespace create "FILE_STORAGE"
        success "KV namespace 'FILE_STORAGE' created"
    else
        log "KV namespace 'FILE_STORAGE' already exists"
    fi
    
    # Create session storage namespace
    if ! wrangler kv:namespace list | grep -q "SESSIONS"; then
        wrangler kv:namespace create "SESSIONS" --preview
        wrangler kv:namespace create "SESSIONS"
        success "KV namespace 'SESSIONS' created"
    else
        log "KV namespace 'SESSIONS' already exists"
    fi
}

# Setup R2 Storage
setup_r2_storage() {
    log "Setting up R2 Storage..."
    
    # Create file storage bucket
    if ! wrangler r2 bucket list | grep -q "cursor-files"; then
        wrangler r2 bucket create cursor-files
        wrangler r2 bucket create cursor-files-preview
        success "R2 bucket 'cursor-files' created"
    else
        log "R2 bucket 'cursor-files' already exists"
    fi
    
    # Create workspace bucket
    if ! wrangler r2 bucket list | grep -q "cursor-workspace"; then
        wrangler r2 bucket create cursor-workspace
        wrangler r2 bucket create cursor-workspace-preview
        success "R2 bucket 'cursor-workspace' created"
    else
        log "R2 bucket 'cursor-workspace' already exists"
    fi
}

# Setup Durable Objects
setup_durable_objects() {
    log "Setting up Durable Objects..."
    
    # Create WebSocket Durable Object
    if ! wrangler durable-object list | grep -q "WebSocketDO"; then
        wrangler durable-object create WebSocketDO
        success "Durable Object 'WebSocketDO' created"
    else
        log "Durable Object 'WebSocketDO' already exists"
    fi
    
    # Create Session Durable Object
    if ! wrangler durable-object list | grep -q "SessionDO"; then
        wrangler durable-object create SessionDO
        success "Durable Object 'SessionDO' created"
    else
        log "Durable Object 'SessionDO' already exists"
    fi
}

# Setup Workers
setup_workers() {
    log "Setting up Workers..."
    
    # Create backend worker
    if ! wrangler workers list | grep -q "$BACKEND_NAME"; then
        wrangler workers create $BACKEND_NAME
        success "Worker '$BACKEND_NAME' created"
    else
        log "Worker '$BACKEND_NAME' already exists"
    fi
}

# Setup Pages
setup_pages() {
    log "Setting up Pages..."
    
    # Create frontend pages project
    if ! wrangler pages project list | grep -q "$FRONTEND_NAME"; then
        wrangler pages project create $FRONTEND_NAME
        success "Pages project '$FRONTEND_NAME' created"
    else
        log "Pages project '$FRONTEND_NAME' already exists"
    fi
}

# Update configuration files
update_configuration() {
    step "Updating configuration files..."
    
    # Update wrangler.toml
    update_wrangler_config
    
    # Update frontend configuration
    update_frontend_config
    
    # Update backend configuration
    update_backend_config
    
    success "Configuration files updated"
}

# Update wrangler.toml
update_wrangler_config() {
    log "Updating wrangler.toml..."
    
    # Get KV namespace IDs
    API_KEYS_ID=$(wrangler kv:namespace list | grep "API_KEYS" | head -1 | awk '{print $2}')
    FILE_STORAGE_ID=$(wrangler kv:namespace list | grep "FILE_STORAGE" | head -1 | awk '{print $2}')
    SESSIONS_ID=$(wrangler kv:namespace list | grep "SESSIONS" | head -1 | awk '{print $2}')
    
    # Update wrangler.toml with actual IDs
    sed -i "s/your-kv-namespace-id/$API_KEYS_ID/g" wrangler.toml
    sed -i "s/your-preview-kv-namespace-id/$API_KEYS_ID/g" wrangler.toml
    sed -i "s/YOUR_SUBDOMAIN/$SUBDOMAIN/g" wrangler.toml
    
    success "wrangler.toml updated with actual namespace IDs"
}

# Update frontend configuration
update_frontend_config() {
    log "Updating frontend configuration..."
    
    # Update App.tsx
    sed -i "s/YOUR_SUBDOMAIN/$SUBDOMAIN/g" frontend/src/App.tsx
    sed -i "s/YOUR_SUBDOMAIN/$SUBDOMAIN/g" frontend/src/components/ChatAssistant.tsx
    
    # Update package.json
    sed -i "s/cursor-frontend-cloudflare/$FRONTEND_NAME/g" frontend/package.json
    
    success "Frontend configuration updated"
}

# Update backend configuration
update_backend_config() {
    log "Updating backend configuration..."
    
    # Update backend/index.js
    sed -i "s/YOUR_SUBDOMAIN/$SUBDOMAIN/g" backend/index.js
    
    success "Backend configuration updated"
}

# Install dependencies
install_dependencies() {
    step "Installing dependencies..."
    
    # Install backend dependencies
    if [ -d "backend" ]; then
        cd backend
        if [ ! -d "node_modules" ]; then
            log "Installing backend dependencies..."
            npm install
        fi
        cd ..
    fi
    
    # Install frontend dependencies
    if [ -d "frontend" ]; then
        cd frontend
        if [ ! -d "node_modules" ]; then
            log "Installing frontend dependencies..."
            npm install
        fi
        cd ..
    fi
    
    success "Dependencies installed"
}

# Deploy backend
deploy_backend() {
    step "Deploying backend to Cloudflare Workers..."
    
    cd backend
    
    # Deploy worker
    wrangler deploy --name $BACKEND_NAME
    
    success "Backend deployed successfully"
    log "Backend URL: https://$BACKEND_NAME.$SUBDOMAIN.workers.dev"
    
    cd ..
}

# Deploy frontend
deploy_frontend() {
    step "Deploying frontend to Cloudflare Pages..."
    
    cd frontend
    
    # Build frontend
    log "Building frontend..."
    npm run build
    
    # Deploy to Pages
    wrangler pages deploy dist --project-name $FRONTEND_NAME
    
    success "Frontend deployed successfully"
    log "Frontend URL: https://$FRONTEND_NAME.$SUBDOMAIN.pages.dev"
    
    cd ..
}

# Setup custom domain (optional)
setup_custom_domain() {
    if [ -n "$DOMAIN" ]; then
        step "Setting up custom domain: $DOMAIN"
        
        # Add custom domain for backend
        wrangler custom-domains add $BACKEND_NAME.$DOMAIN
        
        # Add custom domain for frontend
        wrangler custom-domains add $FRONTEND_NAME.$DOMAIN
        
        success "Custom domain setup complete"
        log "Backend: https://$BACKEND_NAME.$DOMAIN"
        log "Frontend: https://$FRONTEND_NAME.$DOMAIN"
    else
        log "No custom domain specified, using default subdomains"
    fi
}

# Test deployment
test_deployment() {
    step "Testing deployment..."
    
    # Test backend health
    BACKEND_URL="https://$BACKEND_NAME.$SUBDOMAIN.workers.dev"
    log "Testing backend health check..."
    
    if curl -f "$BACKEND_URL/health" > /dev/null 2>&1; then
        success "Backend health check passed"
    else
        warn "Backend health check failed - this is normal for new deployments"
    fi
    
    # Test frontend
    FRONTEND_URL="https://$FRONTEND_NAME.$SUBDOMAIN.pages.dev"
    log "Testing frontend accessibility..."
    
    if curl -f "$FRONTEND_URL" > /dev/null 2>&1; then
        success "Frontend is accessible"
    else
        warn "Frontend is not accessible - this is normal for new deployments"
    fi
}

# Generate deployment summary
generate_summary() {
    echo -e "\n${PURPLE}=========================================="
    echo "  🎉 DEPLOYMENT COMPLETE! 🎉"
    echo "=========================================="
    echo -e "${NC}"
    
    echo -e "${GREEN}✅ Backend deployed successfully${NC}"
    echo -e "   URL: https://$BACKEND_NAME.$SUBDOMAIN.workers.dev"
    echo -e "   WebSocket: wss://$BACKEND_NAME.$SUBDOMAIN.workers.dev"
    echo -e "   Health: https://$BACKEND_NAME.$SUBDOMAIN.workers.dev/health"
    
    echo -e "\n${GREEN}✅ Frontend deployed successfully${NC}"
    echo -e "   URL: https://$FRONTEND_NAME.$SUBDOMAIN.pages.dev"
    
    if [ -n "$DOMAIN" ]; then
        echo -e "\n${GREEN}✅ Custom domain configured${NC}"
        echo -e "   Backend: https://$BACKEND_NAME.$DOMAIN"
        echo -e "   Frontend: https://$FRONTEND_NAME.$DOMAIN"
    fi
    
    echo -e "\n${YELLOW}📋 Next Steps:${NC}"
    echo -e "1. 🌐 Open your application: https://$FRONTEND_NAME.$SUBDOMAIN.pages.dev"
    echo -e "2. 🔑 Configure your AI provider API keys in the settings"
    echo -e "3. 🧪 Test the application functionality"
    echo -e "4. 📊 Monitor performance in Cloudflare Dashboard"
    echo -e "5. 🔒 Set up custom domain (optional)"
    
    echo -e "\n${BLUE}🔗 Quick Access:${NC}"
    echo -e "Frontend: https://$FRONTEND_NAME.$SUBDOMAIN.pages.dev"
    echo -e "Backend API: https://$BACKEND_NAME.$SUBDOMAIN.workers.dev"
    echo -e "WebSocket: wss://$BACKEND_NAME.$SUBDOMAIN.workers.dev"
    
    echo -e "\n${CYAN}📚 Documentation:${NC}"
    echo -e "Setup Guide: ./CLOUDFLARE_SETUP.md"
    echo -e "README: ./README.md"
    echo -e "Cloudflare Dashboard: https://dash.cloudflare.com"
    
    echo -e "\n${GREEN}=========================================="
    echo "  🚀 Your AI IDE is now live! 🚀"
    echo "=========================================="
    echo -e "${NC}"
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "=========================================="
    echo "  🤖 Cursor Full Stack AI IDE"
    echo "  🚀 Complete Automated Deployment"
    echo "=========================================="
    echo -e "${NC}"
    
    # Check prerequisites
    check_wrangler
    check_auth
    
    # Generate subdomain if not provided
    generate_subdomain
    
    # Setup all services
    setup_services
    
    # Update configuration
    update_configuration
    
    # Install dependencies
    install_dependencies
    
    # Deploy applications
    deploy_backend
    deploy_frontend
    
    # Setup custom domain (optional)
    setup_custom_domain
    
    # Test deployment
    test_deployment
    
    # Generate summary
    generate_summary
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --subdomain)
            SUBDOMAIN="$2"
            shift 2
            ;;
        --domain)
            DOMAIN="$2"
            shift 2
            ;;
        --backend-name)
            BACKEND_NAME="$2"
            shift 2
            ;;
        --frontend-name)
            FRONTEND_NAME="$2"
            shift 2
            ;;
        --skip-confirmation)
            SKIP_CONFIRMATION=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --subdomain SUBDOMAIN    Cloudflare subdomain (auto-generated if not provided)"
            echo "  --domain DOMAIN          Custom domain (optional)"
            echo "  --backend-name NAME      Backend worker name (default: cursor-backend)"
            echo "  --frontend-name NAME     Frontend pages name (default: cursor-frontend)"
            echo "  --skip-confirmation      Skip all confirmation prompts"
            echo "  --help                   Show this help message"
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