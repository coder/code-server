#!/bin/bash

# Cursor Full Stack AI IDE - One-Click Deploy to Cloudflare Pages
# This script provides the simplest possible deployment experience

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
echo "  ⚡ One-Click Deploy to Cloudflare Pages"
echo "=========================================="
echo -e "${NC}"

# Check if user wants to proceed
echo -e "${YELLOW}This will automatically:${NC}"
echo "✅ Install Wrangler CLI (if needed)"
echo "✅ Authenticate with Cloudflare"
echo "✅ Install dependencies"
echo "✅ Build the project"
echo "✅ Deploy to Cloudflare Pages"
echo "✅ Provide you with live URL"
echo ""

read -p "Do you want to proceed? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

# Run the deployment
echo -e "${GREEN}Starting deployment...${NC}"
./deploy.sh

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}Your AI IDE is now live and ready to use!${NC}"