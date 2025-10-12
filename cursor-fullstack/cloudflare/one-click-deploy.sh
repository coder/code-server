#!/bin/bash

# Cursor Full Stack AI IDE - One-Click Deployment Script
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
echo "  ⚡ One-Click Deployment"
echo "=========================================="
echo -e "${NC}"

# Check if user wants to proceed
echo -e "${YELLOW}This will automatically:${NC}"
echo "✅ Install Wrangler CLI (if needed)"
echo "✅ Authenticate with Cloudflare"
echo "✅ Create all required services"
echo "✅ Deploy backend and frontend"
echo "✅ Generate random subdomain"
echo "✅ Provide you with live URLs"
echo ""

read -p "Do you want to proceed? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

# Run the automated deployment
echo -e "${GREEN}Starting automated deployment...${NC}"
./auto-deploy.sh --skip-confirmation

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}Your AI IDE is now live and ready to use!${NC}"