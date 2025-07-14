# Statik-Server Usage Guide

## Starting the Server

### Command Line
```bash
# Quick start
statik

# Via CLI
statik-cli start

# With options
statik-cli start --port 8080 --host 0.0.0.0
```

### Desktop Application
Click the "Statik Server" icon in your applications menu.

## Accessing the Server

- **Local**: http://localhost:8080
- **Network**: http://[your-ip]:8080  
- **Secure**: https://[hostname].statik.local:8443
- **Mobile**: Scan QR code (displayed on startup)

## CLI Commands

```bash
statik-cli start          # Start server
statik-cli stop           # Stop server
statik-cli restart        # Restart server
statik-cli status         # Show status
statik-cli logs           # View logs
statik-cli config         # Manage configuration
statik-cli mesh           # Mesh VPN commands
statik-cli open           # Open in browser
```

## GitHub Copilot

GitHub Copilot is automatically configured. To activate:

1. Open VS Code in the browser
2. Sign in to GitHub when prompted
3. Accept Copilot permissions
4. Start coding with AI assistance!

## Mesh VPN

Connect other devices to your development mesh:

```bash
# Generate preauth key
statik-cli mesh key

# Connect device
tailscale up --login-server https://[your-domain]:8443 --authkey [key]
```

## Troubleshooting

- Logs: `statik-cli logs`
- Restart: `statik-cli restart`
- Status: `statik-cli status`
- Reset: `rm -rf ~/.statik-server && ./install.sh`
