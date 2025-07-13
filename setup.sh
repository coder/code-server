#!/usr/bin/env bash
# Statik-Server Main Installer
# Sets up the complete Statik-Server environment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔥 Installing Statik-Server Complete Environment..."
echo "=================================================="

# Install app interface
echo "📱 Installing app interface..."
cd "$SCRIPT_DIR/app"
./install-app.sh

echo ""
echo "🎉 Statik-Server Installation Complete!"
echo "======================================="
echo ""
echo "Quick start:"
echo "  statik-cli build      # Build the server"
echo "  statik-cli start      # Start the server"
echo "  statik-cli status     # Check status"
echo ""
echo "For detailed usage, see: docs/user/APP_INTERFACE.md"
