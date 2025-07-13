#!/bin/bash
# Statik-Server: Sovereign AI Dev Mesh Boot with Integrated Headscale

set -e

echo "🔥 Booting Statik-Server with Mesh VPN..."
echo "========================================"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATIK_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$STATIK_ROOT"

# Ensure all directories exist
mkdir -p /root/.statik/{keys,db,data,logs}
mkdir -p $HOME/AscendNet/storage/memory
mkdir -p .statik/{keys,data,logs,config}

# Copy local keys to runtime location
echo "🔑 Setting up authentication keys..."
if [[ -d ".statik/keys" ]] && [[ -n "$(ls -A .statik/keys 2>/dev/null || true)" ]]; then
    sudo cp -r .statik/keys/* /root/.statik/keys/ 2>/dev/null || true
fi

# Start headscale mesh VPN 
echo "🌐 Starting integrated mesh VPN..."
if [[ -f "./scripts/mesh-start.sh" ]]; then
    ./scripts/mesh-start.sh
else
    echo "[!] Mesh startup not found, using legacy headscale..."
    if [[ -d "internal/mesh" ]]; then
        cd internal/mesh
        if [[ -f "./headscale.sh" ]]; then
            ./headscale.sh &
        elif [[ -f "./headscale" ]]; then
            nohup ./headscale --config ../../.statik/config/headscale.yaml serve > ../../.statik/logs/headscale.log 2>&1 &
        fi
        cd "$STATIK_ROOT"
    fi
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
export GITHUB_TOKEN=$(cat /root/.statik/keys/github-token 2>/dev/null || echo "")
export COPILOT_ENABLED=true
export STATIK_MEMORY_PATH="$HOME/AscendNet/storage/memory"
export STATIK_MESH_ENABLED=true
export STATIK_MESH_KEY=$(cat .statik/keys/codetoken 2>/dev/null || cat /root/.statik/keys/codetoken 2>/dev/null || echo "")

# Check if we have a built statik-server
if [[ -f "./lib/statik-server" ]]; then
    # Launch statik-server with all integrations
    echo "🚀 Launching statik-server..."
    
    # Start the server in background to show startup info
    ./lib/statik-server \
      --auth none \
      --port 8080 \
      --host 0.0.0.0 \
      --disable-telemetry \
      --disable-update-check \
      --extensions-dir /root/.statik/extensions \
      --user-data-dir /root/.statik/userdata &
    
    SERVER_PID=$!
    
elif [[ -f "./out/vs/code/node/cli.js" ]]; then
    # Launch with Node.js build
    echo "🚀 Launching via Node.js..."
    
    # Start the server in background to show startup info
    node ./out/vs/code/node/cli.js \
      --bind-addr 0.0.0.0:8080 \
      --auth none \
      --disable-telemetry \
      --disable-update-check \
      --extensions-dir /root/.statik/extensions \
      --user-data-dir /root/.statik/userdata \
      $HOME &
    
    SERVER_PID=$!
    
else
    echo "❌ No statik-server binary found. Run ./build.sh first."
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
echo "   ✅ GitHub Copilot Chat integration"
echo "   ✅ Mesh VPN networking"
echo "   ✅ Sovereign AI development environment"
echo "   ✅ Mobile-responsive interface"
echo ""
echo "🛑 To stop: Press Ctrl+C or run 'statik-cli stop'"
echo ""

# Wait for the server process
wait $SERVER_PID
