#!/bin/bash
# Statik-Server: Clean VS Code Broadcasting with Domain + Mesh VPN

set -e

echo "🚀 Statik VS Code Broadcasting Server"
echo "===================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATIK_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$STATIK_ROOT"

# Configuration
DOMAIN_NAME="${STATIK_DOMAIN:-$(hostname).statik.local}"
CERT_DIR="$HOME/.statik/certs"
MESH_DIR="./internal/mesh"

echo "🌐 Broadcasting domain: $DOMAIN_NAME"

# Ensure directories exist
mkdir -p "$HOME/.statik/{keys,db,userdata,logs,certs}"# Statik-Server: Clean VS Code Broadcasting with Domain + Mesh VPN

set -e

echo "� Statik VS Code Broadcasting Server"
echo "===================================="

# Delegate to clean startup implementation
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/startup-clean.sh" "$@"
mkdir -p .statik/{keys,data,logs,config}

# Copy local keys to runtime location
echo "🔑 Setting up authentication keys..."
if [[ -d ".statik/keys" ]] && [[ -n "$(ls -A .statik/keys 2>/dev/null || true)" ]]; then
    cp -r .statik/keys/* "$HOME/.statik/keys/" 2>/dev/null || true
fi

# Start headscale mesh VPN 
echo "🌐 Starting integrated mesh VPN..."
if [[ -f "./scripts/mesh-start.sh" ]]; then
    ./scripts/mesh-start.sh || echo "⚠️  Mesh VPN startup failed, continuing without it..."
else
    echo "[!] Mesh startup not found, continuing without mesh VPN..."
fi

# Wait for headscale to initialize
sleep 5

# Get local IP address for QR code
get_local_ip() {
    # Try multiple methods to get local IP
    local ip
    ip=$(ip route get 1.1.1.1 2>/dev/null | head -1 | awk '{print $7}' | head -1)
    if [[ -z "$ip" ]]; then
        ip=$(hostname -I 2>/dev/null | awk '{print $1}')
    fi
    if [[ -z "$ip" ]]; then
        ip="localhost"
    fi
    echo "$ip"
}

# Start VS Code with Copilot and mesh integration
echo "💻 Starting Statik-Server with Copilot Chat and Mesh VPN..."

# Inject environment variables for Copilot and Mesh
export GITHUB_TOKEN=$(cat "$HOME/.statik/keys/github-token" 2>/dev/null || echo "")
export COPILOT_ENABLED=true
export STATIK_MEMORY_PATH="$HOME/AscendNet/storage/memory"
export STATIK_MESH_ENABLED=true
export STATIK_MESH_KEY=$(cat .statik/keys/codetoken 2>/dev/null || cat "$HOME/.statik/keys/codetoken" 2>/dev/null || echo "")

# Check if we have the official VS Code CLI
if [[ -f "./lib/code" ]]; then
    # Launch official VS Code Server with web UI and GitHub integration
    echo "🚀 Launching official VS Code Server with tunneling support..."
    
    # Ensure GitHub authentication is available
    if [[ -n "$GITHUB_TOKEN" ]]; then
        echo "✅ GitHub token detected - Copilot Chat will be available"
    else
        echo "⚠️  No GitHub token found - set one with 'statik-cli config token'"
    fi
    
    # Start VS Code serve-web with proper configuration
    ./lib/code serve-web \
      --host 0.0.0.0 \
      --port 8080 \
      --without-connection-token \
      --accept-server-license-terms \
      --server-data-dir "$HOME/.statik/userdata" \
      --verbose &
    
    SERVER_PID=$!
    
elif [[ -f "./lib/statik-server" ]]; then
    # Launch custom statik-server build if available
    echo "🚀 Launching custom statik-server..."
    
    ./lib/statik-server \
      --auth none \
      --port 8080 \
      --host 0.0.0.0 \
      --disable-telemetry \
      --disable-update-check \
      --extensions-dir "$HOME/.statik/extensions" \
      --user-data-dir "$HOME/.statik/userdata" &
    
    SERVER_PID=$!
    
elif [[ -f "./out/vs/code/node/cli.js" ]]; then
    # Launch with Node.js build
    echo "🚀 Launching via Node.js..."
    
    node ./out/vs/code/node/cli.js \
      --bind-addr 0.0.0.0:8080 \
      --auth none \
      --disable-telemetry \
      --disable-update-check \
      --extensions-dir "$HOME/.statik/extensions" \
      --user-data-dir "$HOME/.statik/userdata" \
      $HOME &
    
    SERVER_PID=$!
    
else
    echo "❌ No VS Code server found. Please install the official VS Code CLI:"
    echo "   1. Run './scripts/build.sh' to download VS Code CLI"
    echo "   2. Or download manually from https://code.visualstudio.com/Download"
    exit 1
fi

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 3

# Check if server is running
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "❌ Server failed to start"
    exit 1
fi

# Display connection information with QR code
LOCAL_IP=$(get_local_ip)
SERVER_URL="http://${LOCAL_IP}:8080"

echo ""
echo "✅ Statik-Server Started Successfully!"
echo "======================================"
echo ""
echo "🌐 Access URLs:"
echo "   Local:    http://localhost:8080"
echo "   Network:  $SERVER_URL"
echo ""

# Generate and display QR code for mobile access
if command -v qrencode >/dev/null; then
    echo "📱 Mobile QR Code:"
    echo "=================="
    qrencode -t ansiutf8 "$SERVER_URL"
    echo ""
    echo "📲 Scan the QR code above with your mobile device to access VS Code!"
    echo ""
else
    echo "📱 For mobile access, open: $SERVER_URL"
    echo ""
fi

echo "🎯 Features Available:"
echo "   ✅ Official VS Code 1.102.0+ with full feature set"
echo "   ✅ GitHub Copilot Chat integration (if token provided)"
echo "   ✅ VS Code extensions and marketplace access"
echo "   ✅ Tunneling support for secure remote access"
echo "   ✅ Mobile-responsive web interface"
echo "   ✅ Real-time collaborative editing"
echo ""
echo "🛑 To stop: Press Ctrl+C or run 'statik-cli stop'"
echo ""

# Wait for the server process
wait $SERVER_PID
