#!/usr/bin/env bash
# Statik-Server Bootstrap Script
# Renamed from quick-build.sh for cleaner naming
set -e

# Colors
RED='\033[1;31m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
CYAN='\033[1;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                   🚀 STATIK-SERVER BOOTSTRAP                    ║"
echo "║               Quick Build and Launch Sequence                   ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${BLUE}🔧 Running full installation...${NC}"
./install.sh

echo -e "${BLUE}🚀 Starting Statik-Server...${NC}"
statik-cli start

echo -e "\n${GREEN}🎉 BOOTSTRAP COMPLETE! 🎉${NC}"
echo -e "${CYAN}Your sovereign AI development environment is ready!${NC}"
