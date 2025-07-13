# Statik Mesh VPN Overview

Statik-Server includes an integrated mesh VPN solution based on Headscale, providing secure, global access to your development environment without relying on external services.

## 🌐 What is Statik Mesh?

Statik Mesh is a **sovereign mesh VPN** that creates secure, encrypted tunnels between your devices, allowing you to access your development environment from anywhere in the world.

### Key Features
- **🔐 WireGuard Encryption**: Industry-standard encryption for all traffic
- **🌍 Global Access**: Connect from anywhere with internet
- **🚫 No External Dependencies**: Self-hosted, no cloud services required
- **⚡ Zero Configuration**: Automatically configured during installation
- **📱 Multi-Platform**: Linux, macOS, Windows, iOS, Android support
- **🔑 Preauth Keys**: Simple device onboarding without manual approval

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Development   │    │  Statik-Server  │    │   Mobile/Laptop │
│     Machine     │◄──►│   Mesh Hub      │◄──►│   Remote Device │
│                 │    │                 │    │                 │
│  VS Code:8080   │    │ Headscale:50443 │    │  Browser/SSH    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                        ▲                        ▲
         │                        │                        │
         └────────── Encrypted WireGuard Mesh ─────────────┘
```

### Components

1. **Headscale Server**: Central coordination server (self-hosted)
2. **Tailscale Clients**: WireGuard-based clients on each device
3. **Statik Integration**: Seamless VS Code and development tool access
4. **Certificate Management**: Automatic SSL certificate generation

## 🚀 Getting Started

### Automatic Setup
The mesh VPN is automatically configured when you run:
```bash
./install.sh
```

No manual configuration required! The installer:
- Builds headscale server from source
- Generates SSL certificates
- Creates mesh configuration
- Starts the mesh hub automatically

### Manual Verification
```bash
# Check mesh status
statik-cli mesh status

# View mesh configuration  
cat ~/.statik-server/config/headscale.yaml

# Check running processes
statik-cli status
```

## 🔗 Connecting Devices

### 1. Generate Preauth Key
On your Statik-Server machine:
```bash
statik-cli mesh key
# Output: statik_mesh_key_abc123def456...
```

### 2. Install Tailscale on Target Device

**Linux (Ubuntu/Debian)**:
```bash
curl -fsSL https://tailscale.com/install.sh | sh
```

**macOS**:
```bash
brew install tailscale
```

**Windows**:
Download and install from https://tailscale.com/download

**iOS/Android**:
Install "Tailscale" from App Store/Play Store

### 3. Connect to Statik Mesh
```bash
sudo tailscale up \
  --login-server https://[your-server-domain]:8443 \
  --authkey statik_mesh_key_abc123def456...
```

Replace `[your-server-domain]` with:
- Your server's IP address, or
- `hostname.statik.local` if using domain broadcasting

### 4. Access Development Environment
Once connected, access VS Code at:
- `http://[mesh-ip]:8080` (where mesh-ip is assigned by the mesh)
- All traffic is encrypted through the mesh VPN

## 🛠️ Management Commands

### Device Management
```bash
# List connected devices
statik-cli mesh devices

# Generate new preauth key
statik-cli mesh key --name "john-laptop"

# Remove device from mesh
statik-cli mesh remove john-laptop

# Show device details
statik-cli mesh info [device-name]
```

### Mesh Status
```bash
# Overall mesh status
statik-cli mesh status

# Show mesh logs
statik-cli mesh logs

# Restart mesh server
statik-cli mesh restart
```

### Network Information
```bash
# Show mesh IP ranges
statik-cli mesh networks

# Show active connections
statik-cli mesh connections

# Display mesh topology
statik-cli mesh topology
```

## 🔧 Configuration

### Default Configuration
The mesh is configured with sensible defaults:

```yaml
# ~/.statik-server/config/headscale.yaml
server_url: https://[hostname].statik.local:8443
listen_addr: 0.0.0.0:50443
grpc_listen_addr: 0.0.0.0:50444

# IP address ranges for mesh devices
ip_prefixes:
  - fd7a:115c:a1e0::/48  # IPv6 range
  - 100.64.0.0/10        # IPv4 range

# DNS configuration
dns_config:
  nameservers:
    - 1.1.1.1
    - 8.8.8.8
  magic_dns: true
  base_domain: statik.local
```

### Custom Configuration
To customize the mesh configuration:

1. Edit `~/.statik-server/config/headscale.yaml`
2. Restart the mesh: `statik-cli mesh restart`

Common customizations:
- Change IP ranges
- Add custom DNS servers
- Modify server URLs
- Configure DERP servers

## 🔐 Security Features

### Encryption
- **WireGuard Protocol**: State-of-the-art VPN protocol
- **ChaCha20 Encryption**: Fast, secure symmetric encryption
- **Curve25519 Key Exchange**: Elliptic curve cryptography
- **BLAKE2s Hashing**: Cryptographic hash function

### Key Management
- **Automatic Key Rotation**: Keys are rotated periodically
- **Preauth Key Expiration**: Time-limited device authorization
- **Certificate-Based Auth**: SSL certificates for server authentication
- **No Cloud Dependencies**: All keys stored locally

### Network Security
- **Split Tunneling**: Only mesh traffic goes through VPN
- **NAT Traversal**: Works behind firewalls and NAT
- **Firewall Friendly**: Uses standard HTTPS port (8443)
- **Local Certificate Authority**: Self-signed certificates

## 🌍 Use Cases

### Remote Development
```bash
# Work from home/coffee shop/anywhere
tailscale up --login-server https://office-server:8443 --authkey [key]
# Access: http://100.64.1.1:8080
```

### Team Collaboration
```bash
# Share development environment with team
statik-cli mesh key --name team-shared
# Team members connect and share same VS Code instance
```

### Mobile Development
```bash
# Test on mobile devices
# Install Tailscale on phone
# Connect to mesh
# Access responsive VS Code interface
```

### CI/CD Integration
```bash
# Give CI server access to development environment
statik-cli mesh key --name ci-pipeline
# CI can run tests against development VS Code instance
```

## 📊 Monitoring and Troubleshooting

### Health Checks
```bash
# Check mesh connectivity
ping 100.64.1.1  # ping another mesh device

# Test VS Code access through mesh
curl http://100.64.1.1:8080

# Verify SSL certificates
openssl x509 -in ~/.statik-server/keys/server.crt -text -noout
```

### Common Issues

**Device can't connect to mesh**
```bash
# Check if headscale server is running
statik-cli mesh status

# Verify firewall allows port 8443
sudo ufw allow 8443

# Check preauth key is valid
statik-cli mesh key --list
```

**Slow mesh performance**
```bash
# Check network latency
tailscale ping [device-name]

# Show connection details
tailscale status --peers

# Optimize DERP server selection
tailscale netcheck
```

**Can't access VS Code through mesh**
```bash
# Verify VS Code is running
statik-cli status

# Check if bound to correct interface
netstat -tlnp | grep 8080

# Test local access first
curl http://localhost:8080
```

## 🔗 Advanced Features

### Custom DERP Servers
For better performance in specific regions:

```yaml
# In headscale.yaml
derp:
  urls:
    - https://controlplane.tailscale.com/derpmap/default
  auto_update_enabled: true
  update_frequency: 24h
```

### ACL (Access Control Lists)
Control which devices can access what:

```json
{
  "ACLs": [
    {
      "Action": "accept",
      "Users": ["*"],
      "Ports": ["*:8080", "*:22"]
    }
  ]
}
```

### Integration with External Tools
```bash
# SSH through mesh
ssh user@100.64.1.2

# MySQL/PostgreSQL access
mysql -h 100.64.1.1 -u dev -p

# Docker registry access
docker pull 100.64.1.1:5000/myapp
```

## 📚 Further Reading

- [Headscale Documentation](https://github.com/juanfont/headscale)
- [WireGuard Protocol](https://www.wireguard.com/)
- [Tailscale Client Documentation](https://tailscale.com/kb/)
- [Statik-Server Usage Guide](../USAGE.md)

## 🆘 Support

For mesh-specific issues:
- Check logs: `statik-cli mesh logs`
- View status: `statik-cli mesh status`
- Report issues: [GitHub Issues](https://github.com/statikfintechllc/AscendNet/issues)
- Community: [GitHub Discussions](https://github.com/statikfintechllc/AscendNet/discussions)
