#!/bin/bash
# Headscale mesh startup for global broadcasting

set -e

echo "🌐 Starting headscale mesh VPN for global access..."

MESH_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$MESH_DIR"

# Ensure database directory exists
mkdir -p "$HOME/.statik/db"

# Initialize headscale if needed
if [[ ! -f "$HOME/.statik/keys/headscale_private.key" ]]; then
    echo "🔐 Initializing headscale..."
    ./headscale init --config headscale.yaml
fi

# Create default namespace
./headscale namespaces create default 2>/dev/null || true

# Generate preauth key for easy connection
if [[ ! -f "$HOME/.statik/keys/preauth.key" ]]; then
    ./headscale preauthkeys create --namespace default --reusable --expiration 24h > "$HOME/.statik/keys/preauth.key"
    echo "🔑 Generated preauth key: $(cat "$HOME/.statik/keys/preauth.key")"
fi

# Start headscale server
echo "🚀 Starting headscale on port 8443 with TLS..."
exec ./headscale serve --config headscale.yaml
