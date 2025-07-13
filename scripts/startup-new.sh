#!/usr/bin/env bash
# Statik-Server Enhanced Startup Script
# Handles VS Code server + mesh VPN + domain broadcasting
set -e

# Configuration
STATIK_HOME="$HOME/.statik-server"
SCRIPT_DIR="$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
PORT=${STATIK_PORT:-8080}
HTTPS_PORT=${STATIK_HTTPS_PORT:-8443}
DOMAIN=${STATIK_DOMAIN:-$(hostname).statik.local}

# Colors
RED='\033[1;31m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
CYAN='\033[1;36m'
NC='\033[0m'

# Logging
log() { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; exit 1; }

# Ensure directories exist
mkdir -p "$STATIK_HOME"/{config,keys,logs,data,extensions}

# Check for required files
check_dependencies() {
    local missing=()
    
    # Check for VS Code CLI
    if [[ ! -f "$REPO_DIR/lib/code" ]]; then
        missing+=("VS Code CLI")
    fi
    
    # Check for certificates
    if [[ ! -f "$STATIK_HOME/keys/server.crt" ]]; then
        missing+=("SSL certificates")
    fi
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        warn "Missing components: ${missing[*]}"
        echo "Run './install.sh' to set up all dependencies."
        exit 1
    fi
}

# Generate QR code for mobile access
generate_qr() {
    local url="$1"
    if command -v qrencode >/dev/null 2>&1; then
        echo -e "\n${CYAN}📱 Mobile Access QR Code:${NC}"
        qrencode -t ansiutf8 "$url"
        echo -e "${BLUE}Scan to access from mobile device${NC}\n"
    fi
}

# Start mesh VPN if available
start_mesh() {
    if [[ -f "$REPO_DIR/lib/headscale" ]] || [[ -f "$REPO_DIR/lib/statik-meshd" ]]; then
        log "Starting mesh VPN..."
        
        # Create headscale config
        cat > "$STATIK_HOME/config/headscale.yaml" << EOF
server_url: https://$DOMAIN:$HTTPS_PORT
listen_addr: 0.0.0.0:50443
metrics_listen_addr: 127.0.0.1:9090
grpc_listen_addr: 0.0.0.0:50444
grpc_allow_insecure: false

private_key_path: $STATIK_HOME/keys/server.key
tls_cert_path: $STATIK_HOME/keys/server.crt

ip_prefixes:
  - fd7a:115c:a1e0::/48
  - 100.64.0.0/10

derp:
  urls: []
  auto_update_enabled: false

log:
  level: info

dns_config:
  nameservers:
    - 1.1.1.1
  domains: []
  magic_dns: true
  base_domain: statik.local
EOF

        # Start headscale/statik-meshd
        if [[ -f "$REPO_DIR/lib/statik-meshd" ]]; then
            "$REPO_DIR/lib/statik-meshd" serve -c "$STATIK_HOME/config/headscale.yaml" >/dev/null 2>&1 &
        elif [[ -f "$REPO_DIR/lib/headscale" ]]; then
            "$REPO_DIR/lib/headscale" serve -c "$STATIK_HOME/config/headscale.yaml" >/dev/null 2>&1 &
        fi
        
        MESH_PID=$!
        echo $MESH_PID > "$STATIK_HOME/mesh.pid"
        log "Mesh VPN started (PID: $MESH_PID)"
    fi
}

# Start HTTPS proxy
start_https_proxy() {
    if command -v socat >/dev/null 2>&1; then
        log "Starting HTTPS proxy on port $HTTPS_PORT..."
        socat TCP-LISTEN:$HTTPS_PORT,fork,reuseaddr \
            OPENSSL:localhost:$PORT,cert="$STATIK_HOME/keys/server.crt",key="$STATIK_HOME/keys/server.key",verify=0 >/dev/null 2>&1 &
        
        PROXY_PID=$!
        echo $PROXY_PID > "$STATIK_HOME/proxy.pid"
        log "HTTPS proxy started (PID: $PROXY_PID)"
    fi
}

# Main startup function
main() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                   🚀 STATIK-SERVER STARTUP                      ║"
    echo "║              Sovereign AI Development Environment               ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    check_dependencies
    start_mesh
    start_https_proxy
    
    log "Starting VS Code server..."
    
    # GitHub token handling
    GITHUB_TOKEN=""
    if [[ -f "$STATIK_HOME/config/github-token" ]]; then
        GITHUB_TOKEN=$(cat "$STATIK_HOME/config/github-token")
    fi
    
    # Export GitHub token for Copilot
    if [[ -n "$GITHUB_TOKEN" ]]; then
        export GITHUB_TOKEN
        log "GitHub Copilot enabled"
    else
        warn "No GitHub token found. Copilot will require authentication on first use."
    fi
    
    # Start VS Code server
    "$REPO_DIR/lib/code" serve-web \
      --host 0.0.0.0 \
      --port $PORT \
      --without-connection-token \
      --disable-update-check \
      --disable-workspace-trust \
      --extensions-dir "$STATIK_HOME/extensions" \
      --user-data-dir "$STATIK_HOME/data" \
      $HOME &
    
    SERVER_PID=$!
    echo $SERVER_PID > "$STATIK_HOME/statik-server.pid"
    
    # Wait for server to start
    sleep 3
    
    echo -e "\n${GREEN}🎉 STATIK-SERVER RUNNING! 🎉${NC}\n"
    
    echo -e "${CYAN}🌐 Access URLs:${NC}"
    echo -e "  ${BLUE}Local:${NC}      http://localhost:$PORT"
    echo -e "  ${BLUE}Network:${NC}    http://$(hostname -I | awk '{print $1}'):$PORT"
    echo -e "  ${BLUE}Secure:${NC}     https://$DOMAIN:$HTTPS_PORT"
    echo ""
    
    echo -e "${CYAN}🔧 Service Information:${NC}"
    echo -e "  ${YELLOW}VS Code Server:${NC}  PID $SERVER_PID (Port $PORT)"
    if [[ -f "$STATIK_HOME/mesh.pid" ]]; then
        echo -e "  ${YELLOW}Mesh VPN:${NC}       PID $(cat "$STATIK_HOME/mesh.pid") (Port 50443)"
    fi
    if [[ -f "$STATIK_HOME/proxy.pid" ]]; then
        echo -e "  ${YELLOW}HTTPS Proxy:${NC}    PID $(cat "$STATIK_HOME/proxy.pid") (Port $HTTPS_PORT)"
    fi
    echo ""
    
    echo -e "${CYAN}📱 Commands:${NC}"
    echo -e "  ${YELLOW}statik-cli status${NC}    # Check detailed status"
    echo -e "  ${YELLOW}statik-cli logs${NC}      # View logs"
    echo -e "  ${YELLOW}statik-cli stop${NC}      # Stop server"
    echo -e "  ${YELLOW}statik-cli mesh key${NC}  # Generate mesh connection key"
    echo ""
    
    # Generate QR codes
    generate_qr "http://localhost:$PORT"
    
    # Log startup
    echo "$(date): Statik-Server started (PID: $SERVER_PID)" >> "$STATIK_HOME/logs/statik-server.log"
    
    # Keep running if not backgrounded
    if [[ "${1:-}" != "--daemon" ]]; then
        echo -e "${GREEN}Press Ctrl+C to stop the server${NC}"
        wait $SERVER_PID
    fi
}

main "$@"
