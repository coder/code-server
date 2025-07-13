# 🚀 Statik-Server
**Sovereign AI Development Environment with Mesh VPN**

Transform any machine into a powerful, globally accessible AI development environment with one command.

## ✨ Features

- **🤖 GitHub Copilot Chat** - Full AI pair programming built-in
- **🌐 Mesh VPN** - Global secure access via integrated Headscale
- **📡 Domain Broadcasting** - Custom domain with HTTPS certificates
- **🔐 Zero Configuration** - Auto-generated keys & certificates
- **📱 Mobile Ready** - QR codes and responsive interface
- **⚡ VS Code 1.102.0+** - Official Microsoft server
- **🎯 One Command Setup** - Complete environment in minutes
- **🌍 Sovereign** - No external dependencies after setup

## 🚀 Quick Start

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
- Creates desktop application
- Configures everything for immediate use

## ⚡ Launch Your Environment

After installation:

```bash
# Start the server
statik

# Check status
statik-cli status

# Interactive management
statik-cli gui
```

## 🌐 Access Your Development Environment

Once running, access through multiple methods:

- **🏠 Local**: http://localhost:8080
- **🌐 Network**: http://[your-ip]:8080
- **🔐 Secure Domain**: https://[hostname].statik.local:8443
- **📱 Mobile**: Scan QR code displayed on startup

## 🤖 AI-Powered Development

GitHub Copilot Chat comes pre-configured:

1. **Start Statik-Server**: `statik`
2. **Open VS Code** in your browser
3. **Sign in to GitHub** (one-time setup)
4. **Start coding with AI assistance!**

### AI Features
- 💬 **Copilot Chat** - Natural language programming assistance
- 🔍 **Code Suggestions** - Real-time code completions
- 📝 **Documentation** - Auto-generate comments and docs
- 🐛 **Bug Detection** - AI-powered error detection
- 🔄 **Code Refactoring** - Intelligent code improvements

## 🌐 Global Mesh VPN Access

Connect additional devices to your development mesh:

### 1. Generate Connection Key
```bash
statik-cli mesh key
# Returns: statik_mesh_key_abc123...
```

### 2. Connect Any Device
```bash
# Install Tailscale on target device
curl -fsSL https://tailscale.com/install.sh | sh

# Connect to your mesh
sudo tailscale up --login-server https://[your-domain]:8443 --authkey [preauth-key]
```

### 3. Access From Anywhere
Now securely access your development environment from:
- 💻 **Laptops** - Work from anywhere
- 📱 **Mobile devices** - Code on the go
- 🏢 **Office computers** - Seamless workflow
- ☁️ **Cloud instances** - Distributed development

## 📱 Command Reference

### Server Management
```bash
statik-cli start         # Start the server
statik-cli stop          # Stop the server  
statik-cli restart       # Restart the server
statik-cli status        # Show detailed status
statik-cli logs          # View server logs
```

### Configuration
```bash
statik-cli config        # Interactive configuration
statik-cli config token  # Set GitHub token for Copilot
statik-cli config list   # Show current settings
```

### Mesh VPN
```bash
statik-cli mesh          # Show mesh status
statik-cli mesh key      # Generate connection key
statik-cli mesh devices  # List connected devices
```

### Utilities
```bash
statik-cli open          # Open in browser
statik-cli gui           # Interactive GUI
statik-cli build         # Rebuild components
statik-cli update        # Update to latest
```

## 🎯 What Makes Statik-Server Different

### 🏛️ Sovereign
- **No External Services**: Everything runs on your infrastructure
- **Self-Signed Certificates**: Your own CA, your rules
- **Local Key Management**: All secrets stored locally
- **Zero Telemetry**: No data leaves your environment

### 🤖 AI-First
- **GitHub Copilot Built-in**: No additional setup required
- **Pre-configured Chat**: AI assistance ready immediately
- **Voice Commands**: Natural language development (optional)
- **Context Aware**: AI understands your entire codebase

### 🌐 Mesh-Native
- **Global VPN Access**: Secure development from anywhere
- **Multi-Device Support**: Seamless device switching
- **Encrypted Tunnels**: WireGuard-based security
- **NAT Traversal**: Works behind any firewall

### 📱 Mobile-Ready
- **QR Code Access**: Instant mobile onboarding
- **Responsive Design**: Full VS Code on mobile
- **Touch Optimization**: Mobile-friendly interface
- **Offline Sync**: Work offline, sync when connected

### ⚡ Zero-Config
- **One Command Install**: Everything automated
- **Auto-Discovery**: Devices find each other automatically
- **Self-Healing**: Automatic error recovery
- **Smart Defaults**: Works perfectly out of the box

## 📦 System Requirements

### Minimum
- **OS**: Linux (Ubuntu 18+) or macOS 10.15+
- **RAM**: 2GB available
- **Disk**: 2GB free space
- **Network**: Internet for initial setup

### Supported Platforms
- ✅ Ubuntu/Debian
- ✅ Fedora/RHEL/CentOS
- ✅ Arch Linux
- ✅ macOS (Intel & Apple Silicon)
- ✅ Alpine Linux
- 🔄 Windows (WSL2)

## 📖 Documentation

Comprehensive guides in [`docs/`](./docs/):

- **[📦 Installation Guide](./docs/INSTALL.md)** - Complete setup instructions
- **[🎯 Usage Guide](./docs/USAGE.md)** - How to use all features
- **[🌐 Mesh VPN Overview](./docs/mesh/MESH_OVERVIEW.md)** - Understanding mesh networking
- **[🔧 Development Guide](./docs/development/STRUCTURE.md)** - For contributors

## 🛠️ Advanced Features

### Custom Extensions
```bash
# Install VS Code extensions
statik-cli ext install ms-python.python
statik-cli ext install ms-vscode.copilot-chat
```

### Environment Variables
```bash
export STATIK_PORT=3000              # Custom port
export STATIK_DOMAIN="dev.local"     # Custom domain
export GITHUB_TOKEN="ghp_..."        # GitHub authentication
```

### Team Collaboration
```bash
# Share development environment with team
statik-cli mesh key --name team-shared
# Team members can now collaborate in real-time
```

### CI/CD Integration
```bash
# Give CI systems access to development environment
statik-cli mesh key --name ci-pipeline
# Automated testing against live development instance
```

## 🔒 Security & Privacy

- **🔐 WireGuard Encryption**: Military-grade VPN security
- **🏠 Self-Hosted**: No data sent to external services
- **🔑 Local Key Storage**: All secrets remain on your infrastructure
- **🛡️ Firewall Friendly**: Uses standard HTTPS ports
- **📋 Certificate Management**: Automatic SSL certificate generation
- **🔄 Key Rotation**: Automatic security key updates

## 🎨 Use Cases

### 👩‍💻 Individual Developers
- Code from anywhere with AI assistance
- Seamless device switching (desktop ↔ laptop ↔ mobile)
- Secure development environment

### 👥 Development Teams
- Shared development environments
- Real-time collaboration with AI
- Consistent tooling across team members

### 🏢 Enterprises
- Secure remote development
- Compliance-friendly (all data stays internal)
- Scalable mesh networking

### 🎓 Education
- Cloud development labs
- Student project environments
- AI-assisted learning

### 🚀 Startups
- Quick development environment setup
- Cost-effective (no cloud bills)
- Scales with team growth

## 🔄 Updates & Maintenance

```bash
# Update to latest version
statik-cli update

# Backup configuration
tar -czf statik-backup.tar.gz ~/.statik-server/

# Reset everything (emergency)
rm -rf ~/.statik-server && ./install.sh
```

## 🤝 Contributing

We welcome contributions! See our [Development Guide](./docs/development/STRUCTURE.md) for:
- Setting up development environment
- Code style guidelines
- Submitting pull requests
- Reporting issues

## 📄 License

MIT License - Use it however you want! See [LICENSE](./LICENSE) for details.

## 🔗 Links

- **🐙 GitHub Repository**: https://github.com/statikfintechllc/AscendNet
- **🐛 Report Issues**: https://github.com/statikfintechllc/AscendNet/issues
- **💬 Discussions**: https://github.com/statikfintechllc/AscendNet/discussions
- **📧 Security Contact**: security@statikfintech.com

## 🎉 Get Started Now

Ready to transform your development workflow with AI and mesh networking?

```bash
curl -sSL https://raw.githubusercontent.com/statikfintechllc/AscendNet/master/statik-server/install.sh | bash
```

**Start coding the future today!** 🚀✨

---

*Made with ❤️ by the StatikFintech team. Building sovereign AI infrastructure for developers worldwide.*
