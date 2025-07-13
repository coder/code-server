# Statik-Server Installation Guide

## 🚀 One-Command Installation

```bash
curl -sSL https://raw.githubusercontent.com/statikfintechllc/AscendNet/master/statik-server/install.sh | bash
```

**That's it!** The installer automatically:
- Detects your platform (Linux/macOS)
- Installs all dependencies (Node.js, Go, Docker, etc.)
- Downloads official VS Code CLI
- Builds mesh VPN components
- Generates SSL certificates and auth keys
- Sets up GitHub Copilot integration
- Creates desktop application entries
- Configures everything for immediate use

## 📦 Manual Installation

If you prefer to inspect before running:

```bash
# 1. Clone the repository
git clone https://github.com/statikfintechllc/AscendNet.git
cd AscendNet/statik-server

# 2. Run the installer
./install.sh

# 3. Start the server
statik
```

## 🔧 System Requirements

### Minimum Requirements
- **OS**: Linux (Ubuntu 18+, Debian 10+, Arch, Fedora) or macOS 10.15+
- **RAM**: 2GB available
- **Disk**: 2GB free space
- **Network**: Internet connection for initial setup

### Supported Platforms
- ✅ Ubuntu/Debian (apt)
- ✅ Fedora/RHEL (yum/dnf)
- ✅ Arch Linux (pacman)
- ✅ macOS (Homebrew)

## 📁 What Gets Installed

### System Dependencies
- **Node.js & npm/pnpm**: JavaScript runtime and package managers
- **Go**: For building mesh VPN components
- **Docker**: Container runtime (optional but recommended)
- **OpenSSL**: SSL certificate generation
- **socat**: HTTPS proxy for secure connections
- **qrencode**: QR code generation for mobile access

### Statik Components
- **VS Code CLI**: Official Microsoft VS Code server
- **Mesh VPN**: Headscale-based private mesh networking
- **Certificates**: Self-signed SSL certificates for HTTPS
- **Desktop Integration**: Application launchers and icons

## 📂 Directory Structure

After installation, your system will have:

```
~/.statik-server/              # Main configuration directory
├── config/                   # Configuration files
│   ├── headscale.yaml       # Mesh VPN configuration
│   ├── copilot.json         # GitHub Copilot settings
│   └── github-token         # GitHub authentication token
├── keys/                     # Certificates and authentication keys
│   ├── server.crt           # SSL certificate
│   ├── server.key           # SSL private key
│   ├── preauth.key          # Mesh VPN preauth key
│   └── api.key              # API authentication key
├── logs/                     # Server logs
│   └── statik-server.log    # Main server log
├── data/                     # VS Code user data
└── extensions/               # VS Code extensions

~/.local/bin/                  # User binaries
├── statik                    # Main launcher command
└── statik-cli                # Command-line interface

~/.local/share/applications/   # Desktop integration
└── statik-server.desktop     # Application launcher

~/.local/share/icons/          # Application icons
└── statik-server.png         # Statik-Server icon
```

## 🎯 Post-Installation Steps

### 1. Verify Installation
```bash
statik-cli status
```

### 2. Set GitHub Token (for Copilot)
```bash
statik-cli config token
# Or authenticate through VS Code when first prompted
```

### 3. Start the Server
```bash
statik
# Or: statik-cli start
```

### 4. Access Your Environment
- **Local**: http://localhost:8080
- **Network**: http://[your-ip]:8080
- **Secure**: https://[hostname].statik.local:8443

## 🔐 Security Considerations

- All certificates are self-signed and stored locally
- Mesh VPN uses WireGuard encryption
- No external dependencies after initial setup
- GitHub token is stored locally and encrypted
- All network traffic within mesh is encrypted

## 🔧 Troubleshooting

### Installation Issues
```bash
# Check system requirements
curl -sSL https://raw.githubusercontent.com/statikfintechllc/AscendNet/master/statik-server/install.sh | bash -s -- --check

# Verbose installation
curl -sSL https://raw.githubusercontent.com/statikfintechllc/AscendNet/master/statik-server/install.sh | bash -s -- --verbose

# Clean reinstall
rm -rf ~/.statik-server
curl -sSL https://raw.githubusercontent.com/statikfintechllc/AscendNet/master/statik-server/install.sh | bash
```

### Common Issues

**Issue**: Permission denied errors
**Solution**: Ensure you're not running as root, script will request sudo when needed

**Issue**: VS Code server won't start
**Solution**: Check logs with `statik-cli logs` and ensure port 8080 is available

**Issue**: Mesh VPN not working
**Solution**: Ensure Go is properly installed and mesh components built successfully

## 🆘 Getting Help

- **Logs**: `statik-cli logs`
- **Status**: `statik-cli status`
- **Reset**: `rm -rf ~/.statik-server && ./install.sh`
- **Issues**: https://github.com/statikfintechllc/AscendNet/issues

## 🚀 Next Steps

After successful installation, see:
- [Usage Guide](./USAGE.md) - How to use Statik-Server
- [Mesh Overview](./mesh/MESH_OVERVIEW.md) - Understanding the mesh VPN
- [Development Guide](./development/STRUCTURE.md) - For developers
