#!/usr/bin/env bash
# mesh-start.sh - Initialize and start headscale mesh VPN for statik-server

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATIK_ROOT="$SCRIPT_DIR"
MESH_DIR="$STATIK_ROOT/internal/mesh"
CONFIG_DIR="$STATIK_ROOT/.statik/config"
KEYS_DIR="$STATIK_ROOT/.statik/keys"
DATA_DIR="$STATIK_ROOT/.statik/data"
LOGS_DIR="$STATIK_ROOT/.statik/logs"

echo "[*] Starting Statik-Server Mesh VPN..."

# Ensure runtime directories exist
mkdir -p "$DATA_DIR" "$LOGS_DIR" /root/.statik/keys 2>/dev/null || true

# Copy keys to root directory for runtime access
if [[ -d "$KEYS_DIR" ]] && [[ -n "$(ls -A "$KEYS_DIR" 2>/dev/null || true)" ]]; then
    echo "[*] Copying authentication keys to runtime location..."
    sudo cp -r "$KEYS_DIR"/* /root/.statik/keys/ 2>/dev/null || true
fi

# Generate headscale private keys if they don't exist
if [[ ! -f "$KEYS_DIR/private.key" ]]; then
    echo "[*] Generating headscale private key..."
    mkdir -p "$KEYS_DIR"
    "$MESH_DIR/headscale" generate private-key > "$KEYS_DIR/private.key"
    sudo cp "$KEYS_DIR/private.key" /root/.statik/keys/ 2>/dev/null || true
fi

if [[ ! -f "$KEYS_DIR/noise_private.key" ]]; then
    echo "[*] Generating noise private key..."
    "$MESH_DIR/headscale" noise generate-private-key > "$KEYS_DIR/noise_private.key"
    sudo cp "$KEYS_DIR/noise_private.key" /root/.statik/keys/ 2>/dev/null || true
fi

# Initialize database if it doesn't exist
if [[ ! -f "$DATA_DIR/headscale.db" ]]; then
    echo "[*] Initializing headscale database..."
    cd "$STATIK_ROOT"
    "$MESH_DIR/headscale" --config "$CONFIG_DIR/headscale.yaml" db init
fi

# Create default namespace if it doesn't exist
echo "[*] Setting up default namespace..."
cd "$STATIK_ROOT"
"$MESH_DIR/headscale" --config "$CONFIG_DIR/headscale.yaml" namespaces create statik-mesh 2>/dev/null || true

# Generate persistent preauth key for mobile clients
PREAUTH_KEY_FILE="$KEYS_DIR/codetoken"
if [[ ! -f "$PREAUTH_KEY_FILE" ]]; then
    echo "[*] Generating persistent preauth key..."
    "$MESH_DIR/headscale" --config "$CONFIG_DIR/headscale.yaml" \
        preauthkeys create --namespace statik-mesh --expiration 0s \
        > "$PREAUTH_KEY_FILE"
    sudo cp "$PREAUTH_KEY_FILE" /root/.statik/keys/ 2>/dev/null || true
    echo "[✓] Preauth key saved to: $PREAUTH_KEY_FILE"
fi

# Start headscale server in background
echo "[*] Starting headscale mesh server..."
cd "$STATIK_ROOT"
nohup "$MESH_DIR/headscale" --config "$CONFIG_DIR/headscale.yaml" serve \
    > "$LOGS_DIR/headscale.log" 2>&1 &

echo "[*] Waiting for headscale to initialize..."
sleep 3

# Verify headscale is running
if pgrep -f "headscale.*serve" > /dev/null; then
    echo "[✓] Headscale mesh VPN is running"
    echo "[*] Mesh server URL: http://127.0.0.1:8080"
    echo "[*] Preauth key location: $PREAUTH_KEY_FILE"
    echo "[*] Mobile clients can connect using the preauth key"
else
    echo "[✗] Failed to start headscale mesh VPN"
    exit 1
fi
