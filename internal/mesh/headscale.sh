#!/bin/bash
# Statik-Server Mesh VPN Boot

export HEADSCALE_CONFIG="/app/internal/mesh/headscale.yaml"

# Ensure directories exist
mkdir -p /root/.statik/{keys,db}

# Initialize headscale if needed
if [ ! -f "/root/.statik/keys/private.key" ]; then
    echo "🔐 Initializing Statik mesh identity..."
    ./headscale init
fi

# Create statik namespace if needed
./headscale namespaces create statik 2>/dev/null || true

# Generate reusable preauth key
if [ ! -f "/root/.statik/keys/preauth.key" ]; then
    ./headscale preauthkeys create --namespace statik --reusable --expiration=never > /root/.statik/keys/preauth.key
    echo "🔑 Generated infinite preauth key"
fi

# Start headscale server
echo "🌐 Starting Statik mesh VPN..."
exec ./headscale serve --config "$HEADSCALE_CONFIG"
