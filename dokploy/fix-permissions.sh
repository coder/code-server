#!/bin/bash

# Code-Server Dokploy Permission Fix Script
# Run this in the dokploy directory: /etc/dokploy/compose/<project-name>/code/dokploy

set -e

echo "Fixing code-server permissions..."

# Create the single volume directory
echo "Creating directory..."
mkdir -p code-server-data

# Set correct ownership (coder user is typically UID 1001)
echo "Setting ownership to coder user (UID 1001)..."
chown -R 1001:1001 code-server-data

# Set read/write/execute for coder user
chmod -R 755 code-server-data

echo "Permissions fixed!"
echo ""
echo "Directory: code-server-data"
echo ""
echo "Next step: Restart the code-server container in Dokploy UI"
