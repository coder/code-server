# 🚀 Statik-Server
**Sovereign AI Development Environment with Mesh VPN**

Transform any machine into a powerful, globally accessible AI development environment with one command.

## ✨ Features

- **🤖 GitHub Copilot Chat** - Full AI pair programming
- **🌐 Mesh VPN** - Global secure access via Headscale
- **📡 Broadcasting** - Custom domain with HTTPS
- **🔐 Zero Config** - Auto-generated keys & certificates
- **📱 Mobile Ready** - QR codes for instant access
- **⚡ VS Code 1.102.0+** - Official Microsoft server
- **🎯 One Command** - Complete environment in minutes

## 🚀 Quick Start

```bash
curl -sSL https://raw.githubusercontent.com/statikfintechllc/AscendNet/master/statik-server/install.sh | bash
```

That's it! The installer handles everything:
- Detects your platform (Linux/macOS)
- Installs all dependencies
- Downloads VS Code CLI
- Builds mesh VPN
- Generates certificates
- Sets up GitHub Copilot
- Creates desktop integration

## ⚡ Launch

After installation:

```bash
# Start the server
statik

# Or use the CLI
statik-cli start

# Check status
statik-cli status
```

## 🌐 Access Your Environment

- **Local**: http://localhost:8080
- **Network**: http://[your-ip]:8080
- **Secure Domain**: https://[hostname].statik.local:8443
- **Mobile**: Scan QR code displayed on startup

## 🤖 AI-Powered Development

GitHub Copilot Chat is pre-configured and ready to use:
1. Open VS Code in your browser
2. Sign in to GitHub (one-time setup)
3. Start coding with AI assistance!

## 🔐 Mesh VPN Access

Connect additional devices to your development mesh:

```bash
# Generate connection key
statik-cli mesh key

# Connect from another device
tailscale up --login-server https://[your-domain]:8443 --authkey [preauth-key]
```

Now access your development environment from anywhere securely!

## 📱 Commands

```bash
statik-cli start         # Start the server
statik-cli stop          # Stop the server  
statik-cli status        # Show detailed status
statik-cli logs          # View server logs
statik-cli config        # Manage configuration
statik-cli mesh          # Mesh VPN management
statik-cli open          # Open in browser
statik-cli gui           # Interactive GUI
```

## 🎯 What Makes This Different

- **Sovereign**: No external services required
- **AI-First**: GitHub Copilot Chat built-in
- **Mesh-Native**: Global VPN access included
- **Zero Config**: Everything automated
- **Mobile Ready**: QR codes and responsive design
- **Enterprise Ready**: Self-signed certificates and domain broadcasting

## 📖 Documentation

Comprehensive documentation in [`docs/`](./docs/):

- [Installation Guide](./docs/INSTALL.md)
- [Usage Guide](./docs/USAGE.md)  
- [Mesh VPN Overview](./docs/mesh/MESH_OVERVIEW.md)
- [Development Structure](./docs/development/STRUCTURE.md)

## 🔗 Repository

- **GitHub**: https://github.com/statikfintechllc/AscendNet
- **Issues**: https://github.com/statikfintechllc/AscendNet/issues
- **License**: MIT

---

**Ready to code from anywhere with AI assistance? Install now and start building the future!** 🚀
