# Statik Server
**Self-Hosted VS Code Broadcasting with Domain + Mesh VPN**

A clean, sovereign VS Code development environment that broadcasts over your own domain with integrated mesh VPN networking.

## 🌟 Features

- **🚀 Official VS Code 1.102.0+** with full feature set
- **🤖 GitHub Copilot Chat** integration (when token provided)
- **🌐 Domain Broadcasting** with self-signed certificates
- **🔐 HTTPS Encryption** for secure remote access
- **🌐 Headscale Mesh VPN** for global secure networking
- **📱 Mobile Access** with QR codes
- **⚡ Real-time Collaboration** and live editing
- **🎯 Zero Configuration** - works out of the box

## 🚀 Quick Start

### 1. Clone and Setup
```bash
git clone https://github.com/statikfintechllc/AscendNet.git
cd AscendNet/statik-server
```

### 2. Install Dependencies
```bash
sudo apt install -y socat openssl qrencode
```

### 3. Set GitHub Token (Optional but recommended for Copilot)
```bash
statik-cli config token
```

### 4. Start Broadcasting
```bash
statik-cli start
```

## 🌐 Access Methods

- **Local**: http://localhost:8080
- **Network**: http://[your-ip]:8080
- **Secure Domain**: https://[hostname].statik.local:8443
- **Mobile**: Scan QR code displayed on startup

## 📱 Commands

```bash
statik-cli start     # Start the server
statik-cli stop      # Stop the server
statik-cli status    # Show status
statik-cli config    # Manage configuration
statik-cli logs      # View logs
```

## 🔧 Configuration

The server automatically:
- Generates self-signed certificates
- Sets up domain broadcasting
- Configures mesh VPN (if available)
- Creates QR codes for mobile access

All configuration is stored in `~/.statik/`

## 🌐 Mesh VPN

Connect other devices to your mesh:
```bash
tailscale up --login-server https://[your-domain]:8443 --authkey [preauth-key]
```

Preauth keys are automatically generated and stored in `~/.statik/keys/preauth.key`

## 🎯 What Makes This Different

- **No Code-Server Baggage**: Clean VS Code implementation
- **Domain Broadcasting**: Your own domain, your rules
- **Mesh Networking**: Secure global access via headscale
- **Mobile First**: QR codes and responsive design
- **Zero Config**: Works immediately after install

## 📄 License

MIT License - Use it however you want

## 🔗 Links

- [Repository](https://github.com/statikfintechllc/AscendNet)
- [Issues](https://github.com/statikfintechllc/AscendNet/issues)
