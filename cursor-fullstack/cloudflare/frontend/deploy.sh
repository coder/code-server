#!/bin/bash

# Cursor Full Stack AI IDE - Deploy to Cloudflare Pages
# This script automates the deployment process to Cloudflare Pages

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "=========================================="
echo "  🚀 Cursor Full Stack AI IDE"
echo "  📦 Deploy to Cloudflare Pages"
echo "=========================================="
echo -e "${NC}"

# Configuration
PROJECT_NAME="cursor-ide"
BUILD_DIR="dist"
NODE_VERSION="18"

# Check if Wrangler is installed
check_wrangler() {
    if ! command -v wrangler &> /dev/null; then
        echo -e "${RED}Wrangler CLI is not installed${NC}"
        echo "Installing Wrangler CLI..."
        npm install -g wrangler
    fi
    echo -e "${GREEN}✅ Wrangler CLI is available${NC}"
}

# Check if user is logged in
check_auth() {
    if ! wrangler whoami &> /dev/null; then
        echo -e "${RED}Not logged in to Cloudflare${NC}"
        echo "Please log in to Cloudflare..."
        wrangler login
    fi
    echo -e "${GREEN}✅ Logged in to Cloudflare${NC}"
}

# Install dependencies
install_dependencies() {
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

# Build the project
build_project() {
    echo -e "${YELLOW}Building project...${NC}"
    npm run build
    echo -e "${GREEN}✅ Project built successfully${NC}"
}

# Create or update Pages project
setup_pages_project() {
    echo -e "${YELLOW}Setting up Pages project...${NC}"
    
    # Check if project exists
    if wrangler pages project list | grep -q "$PROJECT_NAME"; then
        echo "Project $PROJECT_NAME already exists"
    else
        echo "Creating new Pages project: $PROJECT_NAME"
        wrangler pages project create "$PROJECT_NAME"
    fi
    
    echo -e "${GREEN}✅ Pages project ready${NC}"
}

# Deploy to Cloudflare Pages
deploy_to_pages() {
    echo -e "${YELLOW}Deploying to Cloudflare Pages...${NC}"
    
    # Deploy the built files
    wrangler pages deploy "$BUILD_DIR" --project-name "$PROJECT_NAME"
    
    echo -e "${GREEN}✅ Deployed to Cloudflare Pages${NC}"
}

# Get deployment URL
get_deployment_url() {
    echo -e "${YELLOW}Getting deployment URL...${NC}"
    
    # Get the deployment URL
    DEPLOYMENT_URL=$(wrangler pages project list | grep "$PROJECT_NAME" | awk '{print $2}')
    
    if [ -n "$DEPLOYMENT_URL" ]; then
        echo -e "${GREEN}✅ Deployment URL: https://$DEPLOYMENT_URL${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not get deployment URL${NC}"
    fi
}

# Test deployment
test_deployment() {
    echo -e "${YELLOW}Testing deployment...${NC}"
    
    if [ -n "$DEPLOYMENT_URL" ]; then
        if curl -f "https://$DEPLOYMENT_URL" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Deployment is accessible${NC}"
        else
            echo -e "${YELLOW}⚠️  Deployment might not be ready yet${NC}"
        fi
    fi
}

# Show deployment summary
show_summary() {
    echo -e "\n${GREEN}=========================================="
    echo "  🎉 DEPLOYMENT COMPLETE! 🎉"
    echo "=========================================="
    echo -e "${NC}"
    
    echo -e "${GREEN}✅ Frontend deployed successfully${NC}"
    if [ -n "$DEPLOYMENT_URL" ]; then
        echo -e "   URL: https://$DEPLOYMENT_URL"
    fi
    
    echo -e "\n${BLUE}🔗 Access your application:${NC}"
    echo -e "Frontend: https://$DEPLOYMENT_URL"
    echo -e "Backend: https://cursor-backend.workers.dev"
    echo -e "WebSocket: wss://cursor-backend.workers.dev"
    
    echo -e "\n${YELLOW}📋 Next Steps:${NC}"
    echo -e "1. 🌐 Open your application in the browser"
    echo -e "2. 🔑 Configure your AI provider API keys"
    echo -e "3. 🧪 Test the application functionality"
    echo -e "4. 📊 Monitor performance in Cloudflare Dashboard"
    
    echo -e "\n${GREEN}=========================================="
    echo "  🚀 Your AI IDE is now live! 🚀"
    echo "=========================================="
    echo -e "${NC}"
}

# Main execution
main() {
    check_wrangler
    check_auth
    install_dependencies
    build_project
    setup_pages_project
    deploy_to_pages
    get_deployment_url
    test_deployment
    show_summary
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --project-name)
            PROJECT_NAME="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --project-name NAME    Cloudflare Pages project name (default: cursor-ide)"
            echo "  --help                 Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main function
main