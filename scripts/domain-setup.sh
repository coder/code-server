#!/bin/bash
# Domain Setup for Self-Hosted VS Code Broadcasting
# Creates legitimate free domain with self-signed certificates

set -e

echo "🌐 Setting up domain broadcasting for VS Code..."
echo "==============================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATIK_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$STATIK_ROOT"

# Configuration
DOMAIN_NAME="${STATIK_DOMAIN:-$(hostname).local}"
CERT_DIR="$HOME/.statik/certs"
MESH_DIR="./internal/mesh"

echo "🔧 Domain: $DOMAIN_NAME"

# Create certificate directories
mkdir -p "$CERT_DIR" "$HOME/.statik/keys"

# Generate self-signed certificate for the domain
echo "🔐 Generating self-signed certificates..."
if [[ ! -f "$CERT_DIR/$DOMAIN_NAME.crt" ]]; then
    openssl req -x509 -newkey rsa:4096 -keyout "$CERT_DIR/$DOMAIN_NAME.key" \
        -out "$CERT_DIR/$DOMAIN_NAME.crt" -days 365 -nodes \
        -subj "/C=US/ST=State/L=City/O=StatikServer/CN=$DOMAIN_NAME" \
        -addext "subjectAltName=DNS:$DOMAIN_NAME,DNS:localhost,IP:127.0.0.1"
    
    echo "✅ Certificate generated for $DOMAIN_NAME"
else
    echo "✅ Certificate already exists for $DOMAIN_NAME"
fi

# Configure headscale for domain broadcasting
echo "🌐 Configuring headscale mesh for global access..."
cat > "$MESH_DIR/headscale.yaml" << EOF
server_url: https://$DOMAIN_NAME:8443
listen_addr: 0.0.0.0:8443
metrics_listen_addr: 127.0.0.1:9090
grpc_listen_addr: 0.0.0.0:50443

# TLS Configuration for domain
tls_cert_path: $CERT_DIR/$DOMAIN_NAME.crt
tls_key_path: $CERT_DIR/$DOMAIN_NAME.key

# Database
database:
  type: sqlite3
  sqlite:
    path: $HOME/.statik/db/headscale.db

# Logging
log:
  level: info
  format: text

# DNS configuration for global access
dns_config:
  override_local_dns: true
  nameservers:
    - 1.1.1.1
    - 8.8.8.8
  domains: []
  magic_dns: true
  base_domain: $DOMAIN_NAME

# Security
private_key_path: $HOME/.statik/keys/headscale_private.key
noise:
  private_key_path: $HOME/.statik/keys/headscale_noise.key

# Preauth keys for easy connection
preauth_key_expiry: 24h
ephemeral_node_inactivity_timeout: 30m

# DERP configuration for global relay
derp:
  server:
    enabled: true
    region_id: 900
    region_code: "statik"
    region_name: "Statik Server"
    stun_listen_addr: "0.0.0.0:3478"
  urls: []
  paths: []
  auto_update_enabled: false
  update_frequency: 24h
EOF

# Create mesh startup script
cat > "$MESH_DIR/headscale.sh" << 'EOF'
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
EOF

chmod +x "$MESH_DIR/headscale.sh"

# Create VS Code broadcasting configuration
echo "💻 Configuring VS Code for domain broadcasting..."
cat > scripts/vscode-broadcast.sh << EOF
#!/bin/bash
# VS Code Broadcasting Server with Domain Support

set -e

DOMAIN_NAME="$DOMAIN_NAME"
CERT_DIR="$CERT_DIR"
LIB_DIR="\$(cd "\$(dirname "\${BASH_SOURCE[0]}")/.." && pwd)/lib"

echo "🚀 Broadcasting VS Code on domain: \$DOMAIN_NAME"
echo "📁 Broadcasting content from: \$LIB_DIR"

# Set GitHub token for Copilot if available
export GITHUB_TOKEN=\$(cat "\$HOME/.statik/keys/github-token" 2>/dev/null || echo "")

if [[ -n "\$GITHUB_TOKEN" ]]; then
    echo "✅ GitHub Copilot enabled"
else
    echo "⚠️  No GitHub token - Copilot disabled. Set with 'statik-cli config token'"
fi

# Start VS Code with HTTPS and domain support
cd "\$LIB_DIR/.."

if [[ -f "./lib/code" ]]; then
    echo "🌐 Starting VS Code server with HTTPS on \$DOMAIN_NAME:8080"
    
    # Use official VS Code with custom certificate
    ./lib/code serve-web \\
        --host 0.0.0.0 \\
        --port 8080 \\
        --without-connection-token \\
        --accept-server-license-terms \\
        --server-data-dir "\$HOME/.statik/userdata" \\
        --verbose &
    
    VS_PID=\$!
    
    # Also start an HTTPS proxy for secure domain access
    echo "🔐 Starting HTTPS proxy on \$DOMAIN_NAME:8443"
    socat OPENSSL-LISTEN:8443,cert=\$CERT_DIR/\$DOMAIN_NAME.crt,key=\$CERT_DIR/\$DOMAIN_NAME.key,verify=0,reuseaddr,fork TCP:localhost:8080 &
    
    PROXY_PID=\$!
    
    echo "\$VS_PID" > "\$HOME/.statik/vscode.pid"
    echo "\$PROXY_PID" > "\$HOME/.statik/proxy.pid"
    
    # Display access information
    LOCAL_IP=\$(ip route get 1.1.1.1 2>/dev/null | head -1 | awk '{print \$7}' | head -1)
    
    echo ""
    echo "✅ VS Code Broadcasting Active!"
    echo "=============================="
    echo "🌐 Domain Access:"
    echo "   HTTPS: https://\$DOMAIN_NAME:8443"
    echo "   HTTP:  http://\$DOMAIN_NAME:8080"
    echo ""
    echo "🏠 Local Access:"
    echo "   HTTPS: https://localhost:8443"
    echo "   HTTP:  http://localhost:8080"
    echo ""
    echo "📡 Network Access:"
    echo "   HTTPS: https://\$LOCAL_IP:8443"
    echo "   HTTP:  http://\$LOCAL_IP:8080"
    echo ""
    echo "🔗 Mesh VPN: Join with preauth key in \$HOME/.statik/keys/preauth.key"
    
    wait \$VS_PID
else
    echo "❌ VS Code not found in ./lib/code"
    exit 1
fi
EOF

chmod +x scripts/vscode-broadcast.sh

echo ""
echo "✅ Domain broadcasting setup complete!"
echo "====================================="
echo "🌐 Domain: $DOMAIN_NAME"
echo "🔐 Certificates: $CERT_DIR/"
echo "🌐 Mesh config: $MESH_DIR/headscale.yaml"
echo ""
echo "Next steps:"
echo "1. Start mesh: ./internal/mesh/headscale.sh"
echo "2. Start VS Code: ./scripts/vscode-broadcast.sh"
echo "3. Access via: https://$DOMAIN_NAME:8443"
echo ""
echo "📱 Mobile: Use preauth key from $HOME/.statik/keys/preauth.key"
