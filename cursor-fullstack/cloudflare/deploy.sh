#!/bin/bash

# Cursor Full Stack AI IDE - Cloudflare Deployment Script
# This script deploys the application to Cloudflare Workers and Pages

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BACKEND_NAME="cursor-backend"
FRONTEND_NAME="cursor-frontend"
SUBDOMAIN=${SUBDOMAIN:-"your-subdomain"}
DOMAIN=${DOMAIN:-""}

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

# Check if Wrangler is installed
check_wrangler() {
    if ! command -v wrangler &> /dev/null; then
        error "Wrangler CLI is not installed"
        log "Install it with: npm install -g wrangler"
        exit 1
    fi
    
    log "Wrangler CLI is available"
}

# Check if user is logged in
check_auth() {
    if ! wrangler whoami &> /dev/null; then
        error "Not logged in to Cloudflare"
        log "Login with: wrangler login"
        exit 1
    fi
    
    log "Logged in to Cloudflare"
}

# Setup KV Storage
setup_kv() {
    log "Setting up KV Storage..."
    
    # Create API keys namespace
    if ! wrangler kv:namespace list | grep -q "API_KEYS"; then
        wrangler kv:namespace create "API_KEYS"
        wrangler kv:namespace create "API_KEYS" --preview
        success "KV namespace 'API_KEYS' created"
    else
        log "KV namespace 'API_KEYS' already exists"
    fi
    
    # Create file storage namespace
    if ! wrangler kv:namespace list | grep -q "FILE_STORAGE"; then
        wrangler kv:namespace create "FILE_STORAGE"
        wrangler kv:namespace create "FILE_STORAGE" --preview
        success "KV namespace 'FILE_STORAGE' created"
    else
        log "KV namespace 'FILE_STORAGE' already exists"
    fi
}

# Setup R2 Storage
setup_r2() {
    log "Setting up R2 Storage..."
    
    # Create file storage bucket
    if ! wrangler r2 bucket list | grep -q "cursor-files"; then
        wrangler r2 bucket create cursor-files
        wrangler r2 bucket create cursor-files-preview
        success "R2 bucket 'cursor-files' created"
    else
        log "R2 bucket 'cursor-files' already exists"
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
}

# Deploy Backend
deploy_backend() {
    log "Deploying Backend to Cloudflare Workers..."
    
    cd backend
    
    # Install dependencies
    if [ ! -d "node_modules" ]; then
        log "Installing backend dependencies..."
        npm install
    fi
    
    # Deploy worker
    wrangler deploy --name $BACKEND_NAME
    
    success "Backend deployed successfully"
    log "Backend URL: https://$BACKEND_NAME.$SUBDOMAIN.workers.dev"
    
    cd ..
}

# Deploy Frontend
deploy_frontend() {
    log "Deploying Frontend to Cloudflare Pages..."
    
    cd frontend
    
    # Install dependencies
    if [ ! -d "node_modules" ]; then
        log "Installing frontend dependencies..."
        npm install
    fi
    
    # Build frontend
    log "Building frontend..."
    npm run build
    
    # Deploy to Pages
    wrangler pages deploy dist --project-name $FRONTEND_NAME
    
    success "Frontend deployed successfully"
    log "Frontend URL: https://$FRONTEND_NAME.$SUBDOMAIN.pages.dev"
    
    cd ..
}

# Update configuration
update_config() {
    log "Updating configuration..."
    
    # Update backend URL in frontend
    if [ -f "frontend/src/App.tsx" ]; then
        sed -i "s/YOUR_SUBDOMAIN/$SUBDOMAIN/g" frontend/src/App.tsx
        sed -i "s/YOUR_SUBDOMAIN/$SUBDOMAIN/g" frontend/src/components/ChatAssistant.tsx
    fi
    
    # Update wrangler.toml
    if [ -f "wrangler.toml" ]; then
        sed -i "s/YOUR_SUBDOMAIN/$SUBDOMAIN/g" wrangler.toml
    fi
    
    success "Configuration updated"
}

# Setup custom domain (optional)
setup_custom_domain() {
    if [ -n "$DOMAIN" ]; then
        log "Setting up custom domain: $DOMAIN"
        
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
    log "Testing deployment..."
    
    # Test backend health
    BACKEND_URL="https://$BACKEND_NAME.$SUBDOMAIN.workers.dev"
    if curl -f "$BACKEND_URL/health" > /dev/null 2>&1; then
        success "Backend health check passed"
    else
        warn "Backend health check failed"
    fi
    
    # Test frontend
    FRONTEND_URL="https://$FRONTEND_NAME.$SUBDOMAIN.pages.dev"
    if curl -f "$FRONTEND_URL" > /dev/null 2>&1; then
        success "Frontend is accessible"
    else
        warn "Frontend is not accessible"
    fi
}

# Generate deployment summary
generate_summary() {
    echo -e "\n${CYAN}=== Deployment Summary ===${NC}"
    echo -e "${GREEN}✅ Backend deployed successfully${NC}"
    echo -e "   URL: https://$BACKEND_NAME.$SUBDOMAIN.workers.dev"
    echo -e "   WebSocket: wss://$BACKEND_NAME.$SUBDOMAIN.workers.dev"
    
    echo -e "\n${GREEN}✅ Frontend deployed successfully${NC}"
    echo -e "   URL: https://$FRONTEND_NAME.$SUBDOMAIN.pages.dev"
    
    if [ -n "$DOMAIN" ]; then
        echo -e "\n${GREEN}✅ Custom domain configured${NC}"
        echo -e "   Backend: https://$BACKEND_NAME.$DOMAIN"
        echo -e "   Frontend: https://$FRONTEND_NAME.$DOMAIN"
    fi
    
    echo -e "\n${YELLOW}📋 Next Steps:${NC}"
    echo -e "1. Configure your AI provider API keys"
    echo -e "2. Test the application functionality"
    echo -e "3. Set up monitoring and alerts"
    echo -e "4. Configure custom domain (if needed)"
    
    echo -e "\n${BLUE}🔗 Access your application:${NC}"
    echo -e "Frontend: https://$FRONTEND_NAME.$SUBDOMAIN.pages.dev"
    echo -e "Backend API: https://$BACKEND_NAME.$SUBDOMAIN.workers.dev"
    echo -e "WebSocket: wss://$BACKEND_NAME.$SUBDOMAIN.workers.dev"
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "=========================================="
    echo "  Cursor Full Stack AI IDE"
    echo "  Cloudflare Deployment Script"
    echo "=========================================="
    echo -e "${NC}"
    
    # Check prerequisites
    check_wrangler
    check_auth
    
    # Setup services
    setup_kv
    setup_r2
    setup_durable_objects
    
    # Update configuration
    update_config
    
    # Deploy applications
    deploy_backend
    deploy_frontend
    
    # Setup custom domain (optional)
    setup_custom_domain
    
    # Test deployment
    test_deployment
    
    # Generate summary
    generate_summary
    
    echo -e "\n${GREEN}=========================================="
    echo "  Deployment Complete!"
    echo "=========================================="
    echo -e "${NC}"
    
    success "Your Cursor Full Stack AI IDE is now live on Cloudflare!"
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
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --subdomain SUBDOMAIN    Cloudflare subdomain (default: your-subdomain)"
            echo "  --domain DOMAIN          Custom domain (optional)"
            echo "  --backend-name NAME      Backend worker name (default: cursor-backend)"
            echo "  --frontend-name NAME     Frontend pages name (default: cursor-frontend)"
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