#!/bin/bash

# Cursor Full Stack AI IDE - Fixed Deployment Script
# This script fixes common Cloudflare publishing issues

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
echo "  🔧 Fixed Deployment Script"
echo "=========================================="
echo -e "${NC}"

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

# Install frontend dependencies
install_frontend_deps() {
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd frontend
    npm install
    cd ..
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
}

# Build frontend
build_frontend() {
    echo -e "${YELLOW}Building frontend...${NC}"
    cd frontend
    npm run build
    cd ..
    echo -e "${GREEN}✅ Frontend built successfully${NC}"
}

# Create KV namespaces if they don't exist
setup_kv_namespaces() {
    echo -e "${YELLOW}Setting up KV namespaces...${NC}"
    
    # Create API_KEYS namespace
    if ! wrangler kv:namespace list | grep -q "API_KEYS"; then
        wrangler kv:namespace create "API_KEYS" --preview
        API_KEYS_ID=$(wrangler kv:namespace create "API_KEYS" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
        echo "API_KEYS_ID=$API_KEYS_ID"
    fi
    
    # Create FILE_STORAGE namespace
    if ! wrangler kv:namespace list | grep -q "FILE_STORAGE"; then
        wrangler kv:namespace create "FILE_STORAGE" --preview
        FILE_STORAGE_ID=$(wrangler kv:namespace create "FILE_STORAGE" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
        echo "FILE_STORAGE_ID=$FILE_STORAGE_ID"
    fi
    
    # Create SESSIONS namespace
    if ! wrangler kv:namespace list | grep -q "SESSIONS"; then
        wrangler kv:namespace create "SESSIONS" --preview
        SESSIONS_ID=$(wrangler kv:namespace create "SESSIONS" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
        echo "SESSIONS_ID=$SESSIONS_ID"
    fi
    
    echo -e "${GREEN}✅ KV namespaces created${NC}"
}

# Create R2 buckets if they don't exist
setup_r2_buckets() {
    echo -e "${YELLOW}Setting up R2 buckets...${NC}"
    
    # Create cursor-files bucket
    if ! wrangler r2 bucket list | grep -q "cursor-files"; then
        wrangler r2 bucket create cursor-files
        wrangler r2 bucket create cursor-files-preview
    fi
    
    echo -e "${GREEN}✅ R2 buckets created${NC}"
}

# Deploy backend
deploy_backend() {
    echo -e "${YELLOW}Deploying backend...${NC}"
    wrangler deploy
    echo -e "${GREEN}✅ Backend deployed successfully${NC}"
}

# Deploy frontend to Pages
deploy_frontend() {
    echo -e "${YELLOW}Deploying frontend to Pages...${NC}"
    
    # Create Pages project if it doesn't exist
    if ! wrangler pages project list | grep -q "cursor-ide"; then
        wrangler pages project create cursor-ide
    fi
    
    # Deploy to Pages
    wrangler pages deploy frontend/dist --project-name cursor-ide
    
    echo -e "${GREEN}✅ Frontend deployed successfully${NC}"
}

# Show deployment summary
show_summary() {
    echo -e "\n${GREEN}=========================================="
    echo "  🎉 DEPLOYMENT COMPLETE! 🎉"
    echo "=========================================="
    echo -e "${NC}"
    
    echo -e "${GREEN}✅ Backend deployed successfully${NC}"
    echo -e "   URL: https://cursor-backend.workers.dev"
    echo -e "   WebSocket: wss://cursor-backend.workers.dev"
    
    echo -e "\n${GREEN}✅ Frontend deployed successfully${NC}"
    echo -e "   URL: https://cursor-ide.pages.dev"
    
    echo -e "\n${YELLOW}📋 Next Steps:${NC}"
    echo -e "1. 🌐 Open your application: https://cursor-ide.pages.dev"
    echo -e "2. 🔑 Configure your AI provider API keys in the settings"
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
    install_frontend_deps
    build_frontend
    setup_kv_namespaces
    setup_r2_buckets
    deploy_backend
    deploy_frontend
    show_summary
}

# Run main function
main