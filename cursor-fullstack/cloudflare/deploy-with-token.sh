#!/bin/bash

# Deploy to Cloudflare with API Token
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
echo "  📦 Deploy with API Token"
echo "=========================================="
echo -e "${NC}"

# Check if API token is provided
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo -e "${RED}Error: CLOUDFLARE_API_TOKEN environment variable is not set${NC}"
    echo "Please set your API token:"
    echo "export CLOUDFLARE_API_TOKEN=your_token_here"
    exit 1
fi

echo -e "${GREEN}✅ API Token is set${NC}"

# Check authentication
echo -e "${YELLOW}Checking authentication...${NC}"
if ! wrangler whoami &> /dev/null; then
    echo -e "${RED}❌ Authentication failed${NC}"
    echo "Please check your API token permissions"
    exit 1
fi

echo -e "${GREEN}✅ Authenticated successfully${NC}"

# Deploy backend
echo -e "${YELLOW}Deploying backend...${NC}"
if wrangler deploy --env=""; then
    echo -e "${GREEN}✅ Backend deployed successfully${NC}"
else
    echo -e "${RED}❌ Backend deployment failed${NC}"
    echo "This might be due to insufficient API token permissions"
    echo "Please check that your token has 'Cloudflare Workers:Edit' permission"
    exit 1
fi

# Build and deploy frontend
echo -e "${YELLOW}Building frontend...${NC}"
cd frontend
npm run build
echo -e "${GREEN}✅ Frontend built successfully${NC}"

echo -e "${YELLOW}Deploying frontend to Pages...${NC}"
if wrangler pages deploy dist --project-name cursor-ide; then
    echo -e "${GREEN}✅ Frontend deployed successfully${NC}"
else
    echo -e "${RED}❌ Frontend deployment failed${NC}"
    echo "This might be due to insufficient API token permissions"
    echo "Please check that your token has 'Cloudflare Pages:Edit' permission"
    exit 1
fi

cd ..

echo -e "\n${GREEN}=========================================="
echo "  🎉 DEPLOYMENT COMPLETE! 🎉"
echo "=========================================="
echo -e "${NC}"

echo -e "${GREEN}✅ Backend deployed successfully${NC}"
echo -e "   URL: https://cursor-backend.workers.dev"
echo -e "   WebSocket: wss://cursor-backend.workers.dev"
echo -e "   Health: https://cursor-backend.workers.dev/health"

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