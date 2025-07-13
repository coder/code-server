#!/bin/bash
# Statik-Server: Sovereign AI Dev Mesh Boot with Integrated Headscale

set -e

echo "🔥 Booting Statik-Server with Mesh VPN..."
echo "========================================"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

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
if [[ -f "./mesh-start.sh" ]]; then
    ./mesh-start.sh
else
    echo "[!] Mesh startup not found, using legacy headscale..."
    if [[ -d "internal/mesh" ]]; then
        cd internal/mesh
        if [[ -f "./headscale.sh" ]]; then
            ./headscale.sh &
        elif [[ -f "./headscale" ]]; then
            nohup ./headscale --config ../../.statik/config/headscale.yaml serve > ../../.statik/logs/headscale.log 2>&1 &
        fi
        cd "$SCRIPT_DIR"
    fi
fi

# Wait for headscale to initialize
sleep 5

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
    exec ./lib/statik-server \
      --auth none \
      --port 8080 \
      --host 0.0.0.0 \
      --disable-telemetry \
      --disable-update-check \
      --extensions-dir /root/.statik/extensions \
      --user-data-dir /root/.statik/userdata
elif [[ -f "./out/vs/code/node/cli.js" ]]; then
    # Launch with Node.js build
    echo "🚀 Launching via Node.js..."
    exec node ./out/vs/code/node/cli.js \
      --bind-addr 0.0.0.0:8080 \
      --auth none \
      --disable-telemetry \
      --disable-update-check \
      --extensions-dir /root/.statik/extensions \
      --user-data-dir /root/.statik/userdata \
      $HOME
else
    echo "❌ No statik-server binary found. Run ./build.sh first."
    exit 1
fi
