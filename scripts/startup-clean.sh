#!/bin/bash
# Clean VS Code Broadcasting Server
# Self-hosted domain with headscale mesh networking

set -e

echo "🚀 Starting Statik VS Code Broadcasting Server"
echo "=============================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATIK_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$STATIK_ROOT"

# Configuration
DOMAIN_NAME="${STATIK_DOMAIN:-$(hostname).statik.local}"
CERT_DIR="$HOME/.statik/certs"
MESH_DIR="./internal/mesh"

echo "🌐 Broadcasting domain: $DOMAIN_NAME"

# Ensure directories exist
mkdir -p "$HOME/.statik/{keys,db,userdata,logs,certs}"

# 1. Setup domain and certificates if needed
if [[ ! -f "$CERT_DIR/$DOMAIN_NAME.crt" ]]; then
    echo "🔧 Setting up domain and certificates..."
    ./scripts/domain-setup.sh
fi

# 2. Start headscale mesh VPN in background
echo "🌐 Starting headscale mesh VPN..."
if [[ -f "$MESH_DIR/headscale" ]]; then
    cd "$MESH_DIR"
    ./headscale.sh > "$HOME/.statik/logs/headscale.log" 2>&1 &
    MESH_PID=$!
    echo $MESH_PID > "$HOME/.statik/mesh.pid"
    echo "✅ Headscale started (PID: $MESH_PID)"
    cd "$STATIK_ROOT"
    sleep 3
else
    echo "⚠️  Headscale not found, continuing without mesh..."
fi

# 3. Setup GitHub authentication for Copilot
export GITHUB_TOKEN=$(cat "$HOME/.statik/keys/github-token" 2>/dev/null || echo "")
if [[ -n "$GITHUB_TOKEN" ]]; then
    echo "✅ GitHub Copilot authentication available"
else
    echo "⚠️  No GitHub token - run 'statik-cli config token' for Copilot Chat"
fi

# 4. Start VS Code server
echo "💻 Starting VS Code server..."
if [[ -f "./lib/code" ]]; then
    # Start VS Code web server
    ./lib/code serve-web \
        --host 0.0.0.0 \
        --port 8080 \
        --without-connection-token \
        --accept-server-license-terms \
        --server-data-dir "$HOME/.statik/userdata" \
        --verbose > "$HOME/.statik/logs/vscode.log" 2>&1 &
    
    VSCODE_PID=$!
    echo $VSCODE_PID > "$HOME/.statik/vscode.pid"
    
    # Wait for VS Code to start
    sleep 5
    
    if kill -0 $VSCODE_PID 2>/dev/null; then
        echo "✅ VS Code started (PID: $VSCODE_PID)"
    else
        echo "❌ VS Code failed to start"
        exit 1
    fi
else
    echo "❌ VS Code not found at ./lib/code"
    echo "Run: curl -Lk 'https://code.visualstudio.com/sha/download?build=stable&os=cli-alpine-x64' --output lib/vscode_cli.tar.gz && cd lib && tar xzf vscode_cli.tar.gz"
    exit 1
fi

# 5. Start HTTPS proxy for secure domain access
echo "🔐 Starting HTTPS proxy for domain access..."
if command -v socat >/dev/null; then
    socat OPENSSL-LISTEN:8443,cert=$CERT_DIR/$DOMAIN_NAME.crt,key=$CERT_DIR/$DOMAIN_NAME.key,verify=0,reuseaddr,fork TCP:localhost:8080 > "$HOME/.statik/logs/proxy.log" 2>&1 &
    PROXY_PID=$!
    echo $PROXY_PID > "$HOME/.statik/proxy.pid"
    echo "✅ HTTPS proxy started (PID: $PROXY_PID)"
else
    echo "⚠️  socat not found - HTTPS proxy unavailable"
    echo "Install with: sudo apt install socat"
fi

# 6. Display access information
LOCAL_IP=$(ip route get 1.1.1.1 2>/dev/null | head -1 | awk '{print $7}' | head -1)
if [[ -z "$LOCAL_IP" ]]; then
    LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
fi

echo ""
echo "🎉 Statik VS Code Broadcasting Active!"
echo "====================================="
echo ""
echo "🌐 Primary Access (Secure):"
echo "   Domain:  https://$DOMAIN_NAME:8443"
echo "   Local:   https://localhost:8443"
echo "   Network: https://$LOCAL_IP:8443"
echo ""
echo "🔓 HTTP Access (Fallback):"
echo "   Domain:  http://$DOMAIN_NAME:8080"
echo "   Local:   http://localhost:8080"
echo "   Network: http://$LOCAL_IP:8080"
echo ""

# Show QR code for mobile access
if command -v qrencode >/dev/null; then
    MOBILE_URL="https://$LOCAL_IP:8443"
    echo "📱 Mobile QR Code (HTTPS):"
    echo "========================="
    qrencode -t ansiutf8 "$MOBILE_URL"
    echo ""
    echo "📲 Scan to access VS Code securely from mobile!"
else
    echo "📱 Mobile URL: https://$LOCAL_IP:8443"
fi

echo ""
echo "🎯 Features Active:"
echo "   ✅ Official VS Code 1.102.0+ with full feature set"
echo "   ✅ Self-signed domain broadcasting ($DOMAIN_NAME)"
echo "   ✅ HTTPS encryption with custom certificates"
echo "   ✅ Headscale mesh VPN for global secure access"
echo "   ✅ GitHub Copilot Chat integration (if token set)"
echo "   ✅ VS Code extensions and marketplace access"
echo "   ✅ Broadcasting content from lib/ directory"
echo ""

# Show mesh connection info if available
if [[ -f "$HOME/.statik/keys/preauth.key" ]]; then
    echo "🔗 Mesh VPN Connection:"
    echo "   Preauth key: $(cat "$HOME/.statik/keys/preauth.key")"
    echo "   Connect with: tailscale up --login-server https://$DOMAIN_NAME:8443 --authkey $(cat "$HOME/.statik/keys/preauth.key")"
    echo ""
fi

echo "🛑 To stop: Press Ctrl+C or run 'statik-cli stop'"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Shutting down Statik VS Code Broadcasting..."
    
    # Stop VS Code
    if [[ -f "$HOME/.statik/vscode.pid" ]]; then
        kill $(cat "$HOME/.statik/vscode.pid") 2>/dev/null || true
        rm -f "$HOME/.statik/vscode.pid"
    fi
    
    # Stop HTTPS proxy
    if [[ -f "$HOME/.statik/proxy.pid" ]]; then
        kill $(cat "$HOME/.statik/proxy.pid") 2>/dev/null || true
        rm -f "$HOME/.statik/proxy.pid"
    fi
    
    # Stop headscale
    if [[ -f "$HOME/.statik/mesh.pid" ]]; then
        kill $(cat "$HOME/.statik/mesh.pid") 2>/dev/null || true
        rm -f "$HOME/.statik/mesh.pid"
    fi
    
    echo "✅ All services stopped"
    exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM

# Wait for VS Code process
wait $VSCODE_PID
