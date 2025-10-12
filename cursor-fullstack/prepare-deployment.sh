#!/bin/bash

# Cursor Full Stack AI IDE - Deployment Preparation Script
# This script prepares the application for Cloudflare Pages deployment

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
echo "  📦 Deployment Preparation"
echo "=========================================="
echo -e "${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Clean and create deployment directory
echo -e "${YELLOW}Cleaning deployment directory...${NC}"
rm -rf deployment-package
mkdir -p deployment-package

# Build frontend
echo -e "${YELLOW}Building frontend...${NC}"
cd cloudflare/frontend
npm install
npm run build

# Copy built files
echo -e "${YELLOW}Copying built files...${NC}"
cp -r dist/* ../../deployment-package/

# Copy configuration files
echo -e "${YELLOW}Copying configuration files...${NC}"
cd ../..

# The configuration files are already in the deployment-package directory
# from when we created them earlier

# Create a simple index.html if it doesn't exist
if [ ! -f "deployment-package/index.html" ]; then
    echo -e "${YELLOW}Creating index.html...${NC}"
    cat > deployment-package/index.html << 'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cursor Full Stack AI IDE</title>
    <meta name="description" content="A complete AI-powered development environment with Monaco Editor, real-time chat, and integrated tools." />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF
fi

# Verify deployment package
echo -e "${YELLOW}Verifying deployment package...${NC}"
if [ -f "deployment-package/index.html" ] && [ -d "deployment-package/assets" ]; then
    echo -e "${GREEN}✅ Deployment package created successfully!${NC}"
else
    echo -e "${RED}❌ Deployment package creation failed${NC}"
    exit 1
fi

# Show deployment package contents
echo -e "${BLUE}Deployment package contents:${NC}"
ls -la deployment-package/

echo -e "\n${GREEN}=========================================="
echo "  🎉 DEPLOYMENT PACKAGE READY! 🎉"
echo "=========================================="
echo -e "${NC}"

echo -e "${YELLOW}Next steps:${NC}"
echo "1. 📁 Upload the 'deployment-package' folder to Cloudflare Pages"
echo "2. 🌐 Or push it to a GitHub repository and connect to Cloudflare Pages"
echo "3. ⚙️  Set the environment variables in Cloudflare Pages dashboard"
echo "4. 🚀 Deploy and enjoy your AI IDE!"

echo -e "\n${BLUE}Environment variables to set:${NC}"
echo "NODE_ENV=production"
echo "VITE_BACKEND_URL=https://cursor-backend.workers.dev"
echo "VITE_WS_URL=wss://cursor-backend.workers.dev"
echo "VITE_APP_NAME=Cursor Full Stack AI IDE"
echo "VITE_APP_VERSION=1.0.0"

echo -e "\n${GREEN}Deployment package is ready in: ./deployment-package/${NC}"