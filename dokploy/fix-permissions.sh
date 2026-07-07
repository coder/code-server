#!/bin/bash

# Code-Server Dokploy Permission Fix Script
# Run this in the dokploy directory: /etc/dokploy/compose/<project-name>/code/dokploy

set -e

echo "🔧 Fixing code-server permissions..."

# Create required directories
echo "📁 Creating required directories..."
mkdir -p data storage settings extensions logs User/globalStorage User/Machine User/history

# Set correct ownership (coder user is typically UID 1001)
echo "🔑 Setting permissions..."
chown -R 1001:1001 data storage settings extensions logs User

# Set read/write/execute for coder user
chmod -R 755 data storage settings extensions logs User

echo "✅ Permissions fixed!"
echo ""
echo "📍 Directories created:"
echo "   - data: User data persistence"
echo "   - storage: Code-server storage"
echo "   - settings: User settings"
echo "   - extensions: Code-server extensions"
echo "   - logs: Application logs"
echo "   - User: User-specific data"
echo ""
echo "🔄 Next step: Restart the code-server container in Dokploy UI"
