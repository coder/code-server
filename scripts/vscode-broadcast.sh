#!/bin/bash
# VS Code Broadcasting Server with Domain Support

set -e

DOMAIN_NAME="GodCore.local"
CERT_DIR="/home/statiksmoke8/.statik/certs"
LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/lib"

echo "🚀 Broadcasting VS Code on domain: $DOMAIN_NAME"
echo "📁 Broadcasting content from: $LIB_DIR"

# Set GitHub token for Copilot if available
export GITHUB_TOKEN=$(cat "$HOME/.statik/keys/github-token" 2>/dev/null || echo "")

if [[ -n "$GITHUB_TOKEN" ]]; then
    echo "✅ GitHub Copilot enabled"
else
    echo "⚠️  No GitHub token - Copilot disabled. Set with 'statik-cli config token'"
fi

# Start VS Code with HTTPS and domain support
cd "$LIB_DIR/.."

if [[ -f "./lib/code" ]]; then
    echo "🌐 Starting VS Code server with HTTPS on $DOMAIN_NAME:8080"
    
    # Use official VS Code with custom certificate
    ./lib/code serve-web \
        --host 0.0.0.0 \
        --port 8080 \
        --without-connection-token \
        --accept-server-license-terms \
        --server-data-dir "$HOME/.statik/userdata" \
        --verbose &
    
    VS_PID=$!
    
    # Also start an HTTPS proxy for secure domain access
    echo "🔐 Starting HTTPS proxy on $DOMAIN_NAME:8443"
    socat OPENSSL-LISTEN:8443,cert=$CERT_DIR/$DOMAIN_NAME.crt,key=$CERT_DIR/$DOMAIN_NAME.key,verify=0,reuseaddr,fork TCP:localhost:8080 &
    
    PROXY_PID=$!
    
    echo "$VS_PID" > "$HOME/.statik/vscode.pid"
    echo "$PROXY_PID" > "$HOME/.statik/proxy.pid"
    
    # Display access information
    LOCAL_IP=$(ip route get 1.1.1.1 2>/dev/null | head -1 | awk '{print $7}' | head -1)
    
    echo ""
    echo "✅ VS Code Broadcasting Active!"
    echo "=============================="
    echo "🌐 Domain Access:"
    echo "   HTTPS: https://$DOMAIN_NAME:8443"
    echo "   HTTP:  http://$DOMAIN_NAME:8080"
    echo ""
    echo "🏠 Local Access:"
    echo "   HTTPS: https://localhost:8443"
    echo "   HTTP:  http://localhost:8080"
    echo ""
    echo "📡 Network Access:"
    echo "   HTTPS: https://$LOCAL_IP:8443"
    echo "   HTTP:  http://$LOCAL_IP:8080"
    echo ""
    echo "🔗 Mesh VPN: Join with preauth key in $HOME/.statik/keys/preauth.key"
    
    wait $VS_PID
else
    echo "❌ VS Code not found in ./lib/code"
    exit 1
fi
