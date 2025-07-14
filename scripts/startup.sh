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

# Detect public IP for global mesh access
detect_public_ip() {
    local public_ip=""
    
    # Try multiple methods to get public IP
    if command -v curl >/dev/null 2>&1; then
        public_ip=$(curl -s --connect-timeout 5 ifconfig.me 2>/dev/null || 
                   curl -s --connect-timeout 5 ipinfo.io/ip 2>/dev/null ||
                   curl -s --connect-timeout 5 checkip.amazonaws.com 2>/dev/null)
    fi
    
    # Fallback to local IP if public detection fails
    if [[ -z "$public_ip" ]] || [[ "$public_ip" =~ ^192\.168\. ]] || [[ "$public_ip" =~ ^10\. ]] || [[ "$public_ip" =~ ^172\.(1[6-9]|2[0-9]|3[0-1])\. ]]; then
        public_ip=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "127.0.0.1")
    fi
    
    echo "$public_ip"
}

PUBLIC_IP=$(detect_public_ip)
# Use public IP for global access, fallback to domain for local
MESH_SERVER_URL=${STATIK_PUBLIC_URL:-"https://$PUBLIC_IP:$HTTPS_PORT"}

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
    if [[ -f "$REPO_DIR/lib/headscale" ]]; then
        log "Starting mesh VPN with global access..."
        log "Mesh server: $MESH_SERVER_URL"
        log "Public IP: $PUBLIC_IP"
        
        # Generate noise private key if it doesn't exist
        if [[ ! -f "$STATIK_HOME/keys/noise.key" ]]; then
            "$REPO_DIR/lib/headscale" generate private-key > "$STATIK_HOME/keys/noise.key"
            chmod 600 "$STATIK_HOME/keys/noise.key"
            log "Generated noise private key"
        fi
        
        # Generate DERP private key if it doesn't exist
        if [[ ! -f "$STATIK_HOME/keys/derp.key" ]]; then
            echo "privkey:$(openssl rand -hex 32)" > "$STATIK_HOME/keys/derp.key"
            chmod 600 "$STATIK_HOME/keys/derp.key"
            log "Generated DERP private key"
        fi
        
        # Create simplified headscale config
        cat > "$STATIK_HOME/config/headscale.yaml" << EOF
# Statik-Server Mesh Configuration (Simplified)
server_url: $MESH_SERVER_URL
listen_addr: 0.0.0.0:50443
metrics_listen_addr: 127.0.0.1:9090

# Keys and certificates
private_key_path: $STATIK_HOME/keys/server.key
noise:
  private_key_path: $STATIK_HOME/keys/noise.key

# Network configuration
prefixes:
  v4: 100.64.0.0/10
  v6: fd7a:115c:a1e0::/48

# Database (SQLite)
database:
  type: sqlite
  sqlite:
    path: $STATIK_HOME/data/headscale.db

# Logging
log:
  level: info
  format: text

# DNS settings
dns:
  magic_dns: true
  base_domain: statik.local
  override_local_dns: false
  nameservers:
    global:
      - 1.1.1.1
      - 8.8.8.8

# Simplified DERP (disable built-in DERP server for now)
derp:
  urls: 
    - https://controlplane.tailscale.com/derpmap/default
  auto_update_enabled: true
  update_frequency: 24h

# Runtime settings
disable_check_updates: true
ephemeral_node_inactivity_timeout: 120m
node_update_check_interval: 10s
unix_socket: $STATIK_HOME/headscale.sock
EOF

        # Kill any existing headscale processes
        pkill -f "headscale.*serve" 2>/dev/null || true
        sleep 2
        
        # Start headscale with better error handling
        log "Starting headscale mesh coordinator..."
        "$REPO_DIR/lib/headscale" serve -c "$STATIK_HOME/config/headscale.yaml" >/dev/null 2>&1 &
        MESH_PID=$!
        echo $MESH_PID > "$STATIK_HOME/mesh.pid"
        
        # Wait and verify it started
        sleep 5
        if kill -0 $MESH_PID 2>/dev/null; then
            log "Mesh VPN started successfully (PID: $MESH_PID)"
            
            # Initialize user and create auto-connect key
            sleep 2
            "$REPO_DIR/lib/headscale" -c "$STATIK_HOME/config/headscale.yaml" users create statik >/dev/null 2>&1 || true
            
            if [[ ! -f "$STATIK_HOME/keys/auto-connect.key" ]]; then
                # Get user ID (should be 1 for first user)
                local user_id=$("$REPO_DIR/lib/headscale" -c "$STATIK_HOME/config/headscale.yaml" users list | tail -1 | awk '{print $1}' | head -1)
                if [[ -n "$user_id" && "$user_id" =~ ^[0-9]+$ ]]; then
                    local auto_key=$("$REPO_DIR/lib/headscale" -c "$STATIK_HOME/config/headscale.yaml" preauthkeys create --user "$user_id" --reusable --expiration 720h 2>/dev/null | tail -1)
                    if [[ -n "$auto_key" && ${#auto_key} -gt 20 ]]; then
                        echo "$auto_key" > "$STATIK_HOME/keys/auto-connect.key"
                        chmod 600 "$STATIK_HOME/keys/auto-connect.key"
                        log "Auto-connect key generated for instant device mesh access"
                    fi
                fi
            fi
        else
            warn "Headscale failed to start properly"
            rm -f "$STATIK_HOME/mesh.pid"
        fi
        
        # Save connection details
        cat > "$STATIK_HOME/config/mesh-connection.json" << EOF
{
    "server_url": "$MESH_SERVER_URL",
    "public_ip": "$PUBLIC_IP",
    "domain": "$DOMAIN",
    "https_port": $HTTPS_PORT,
    "setup_time": "$(date -Iseconds)",
    "auto_connect_available": $([ -f "$STATIK_HOME/keys/auto-connect.key" ] && echo "true" || echo "false")
}
EOF
        
    else
        warn "Headscale binary not found. Mesh VPN disabled."
        warn "Run './install.sh' to set up mesh VPN capabilities."
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

# Check firewall and port accessibility for global mesh
check_global_access() {
    log "Checking global mesh accessibility..."
    
    # List of required ports for global access
    local required_ports=("$HTTPS_PORT" "50443" "3478")
    local warnings=()
    
    for port in "${required_ports[@]}"; do
        # Check if port is listening
        if ! netstat -tuln 2>/dev/null | grep -q ":$port "; then
            if [[ "$port" == "$HTTPS_PORT" ]]; then
                warnings+=("HTTPS port $port not yet listening (will be available after startup)")
            else
                warnings+=("Mesh port $port not listening")
            fi
        fi
        
        # Basic connectivity test (if public IP is not local)
        if [[ "$PUBLIC_IP" != "127.0.0.1" ]] && [[ ! "$PUBLIC_IP" =~ ^192\.168\. ]] && [[ ! "$PUBLIC_IP" =~ ^10\. ]]; then
            # Only test if we have a public IP
            if command -v nc >/dev/null 2>&1; then
                if ! timeout 3 nc -z "$PUBLIC_IP" "$port" 2>/dev/null; then
                    warnings+=("Port $port may not be accessible from internet (check firewall/router)")
                fi
            fi
        fi
    done
    
    # Display warnings if any
    if [[ ${#warnings[@]} -gt 0 ]]; then
        warn "Global access warnings:"
        for warning in "${warnings[@]}"; do
            echo "  ⚠️  $warning"
        done
        echo ""
        echo "For global mesh access, ensure these ports are open:"
        echo "  - $HTTPS_PORT (HTTPS/Web interface)"
        echo "  - 50443 (Headscale mesh coordination)"
        echo "  - 3478 (STUN for NAT traversal)"
        echo ""
    else
        log "Global mesh ports appear accessible ✅"
    fi
}

# Alternative: Use system Tailscale if headscale fails
setup_tailscale_fallback() {
    if command -v tailscale >/dev/null 2>&1; then
        log "Headscale unavailable, offering Tailscale integration..."
        
        echo ""
        echo -e "${YELLOW}🔗 Alternative: Connect to existing Tailscale network${NC}"
        echo "If you have Tailscale installed, you can:"
        echo "1. Start Tailscale: sudo systemctl enable --now tailscaled"
        echo "2. Connect: sudo tailscale up"
        echo "3. Your VS Code will be accessible via Tailscale IP"
        echo ""
        
        # Check if tailscale is already running
        if tailscale ip -4 >/dev/null 2>&1; then
            local ts_ip=$(tailscale ip -4 | head -n 1)
            if [[ -n "$ts_ip" ]]; then
                echo -e "${GREEN}✅ Tailscale already connected!${NC}"
                echo -e "   Tailscale IP: ${CYAN}$ts_ip${NC}"
                echo -e "   VS Code URL: ${CYAN}http://$ts_ip:$PORT${NC}"
                
                # Create tailscale connection info
                cat > "$STATIK_HOME/config/tailscale-connection.json" << EOF
{
    "tailscale_ip": "$ts_ip",
    "vs_code_url": "http://$ts_ip:$PORT",
    "setup_time": "$(date -Iseconds)",
    "type": "tailscale"
}
EOF
            fi
        fi
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
    check_global_access
    start_mesh
    
    # If headscale failed to start, offer Tailscale fallback
    if [[ ! -f "$STATIK_HOME/mesh.pid" ]] || ! kill -0 "$(cat "$STATIK_HOME/mesh.pid" 2>/dev/null)" 2>/dev/null; then
        setup_tailscale_fallback
    fi
    
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
    
    # Start VS Code server with correct arguments
    "$REPO_DIR/lib/code" serve-web \
      --host 0.0.0.0 \
      --port $PORT \
      --without-connection-token \
      --accept-server-license-terms &
    
    SERVER_PID=$!
    echo $SERVER_PID > "$STATIK_HOME/statik-server.pid"
    
    # Wait for server to start
    sleep 3
    
    echo -e "\n${GREEN}🎉 STATIK-SERVER RUNNING! 🎉${NC}\n"
    
    echo -e "${CYAN}🌐 Access URLs:${NC}"
    echo -e "  ${BLUE}Local:${NC}      http://localhost:$PORT"
    echo -e "  ${BLUE}Network:${NC}    http://$(hostname -I | awk '{print $1}'):$PORT"
    echo -e "  ${BLUE}Secure:${NC}     https://$DOMAIN:$HTTPS_PORT"
    if [[ "$PUBLIC_IP" != "127.0.0.1" ]] && [[ ! "$PUBLIC_IP" =~ ^192\.168\. ]]; then
        echo -e "  ${GREEN}🌍 Global:${NC}     $MESH_SERVER_URL"
    fi
    echo ""
    
    # Show mesh auto-connect information
    if [[ -f "$STATIK_HOME/keys/auto-connect.key" ]]; then
        local auto_key=$(cat "$STATIK_HOME/keys/auto-connect.key")
        local local_ip=$(hostname -I | awk '{print $1}')
        local web_url="http://${local_ip}:$PORT"
        
        echo -e "${CYAN}🔗 Instant Mesh Connection:${NC}"
        echo -e "  ${GREEN}1. Install Tailscale:${NC} curl -fsSL https://tailscale.com/install.sh | sh"
        echo -e "  ${GREEN}2. Connect to mesh:${NC}   sudo tailscale up --login-server $MESH_SERVER_URL --authkey $auto_key"
        echo -e "  ${GREEN}3. Access VS Code:${NC}    ${CYAN}$web_url${NC}"
        echo -e "  ${YELLOW}   (Scan QR above ⬆️  or open URL after connecting to mesh)${NC}"
        echo ""
    fi
    
    echo -e "${CYAN}🔧 Service Information:${NC}"
    echo -e "  ${YELLOW}VS Code Server:${NC}  PID $SERVER_PID (Port $PORT)"
    if [[ -f "$STATIK_HOME/mesh.pid" ]]; then
        echo -e "  ${YELLOW}Mesh VPN:${NC}       PID $(cat "$STATIK_HOME/mesh.pid") (Global: $MESH_SERVER_URL)"
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
    
    # Check global access
    check_global_access
    
    # Keep running if not backgrounded
    if [[ "${1:-}" != "--daemon" ]]; then
        echo -e "${GREEN}Press Ctrl+C to stop the server${NC}"
        wait $SERVER_PID
    fi
}

main "$@"
