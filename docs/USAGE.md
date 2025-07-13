# Statik-Server Usage Guide

## 🚀 Starting the Server

### Quick Start
```bash
# Simplest way - just run:
statik
```

### CLI Commands
```bash
# Start the server
statik-cli start

# Start with custom options
STATIK_PORT=3000 statik-cli start
STATIK_DOMAIN=mydev.local statik-cli start
```

### Desktop Application
1. Open your applications menu
2. Look for "Statik Server"
3. Click to launch the interactive GUI

## 🌐 Accessing Your Development Environment

Once started, you can access Statik-Server through multiple methods:

### Local Access
- **URL**: http://localhost:8080
- **Use**: Development on the same machine
- **Features**: Full VS Code experience with extensions

### Network Access
- **URL**: http://[your-ip]:8080
- **Use**: Access from other devices on your network
- **Features**: Same as local, accessible to teammates

### Secure Domain Access
- **URL**: https://[hostname].statik.local:8443
- **Use**: Secure access with self-signed certificates
- **Features**: HTTPS encryption, domain-based access

### Mobile Access
- **Method**: Scan QR code displayed on startup
- **Features**: Responsive VS Code interface optimized for mobile

## 📱 Command Line Interface

### Server Management
```bash
statik-cli start          # Start the server
statik-cli stop           # Stop the server
statik-cli restart        # Restart the server
statik-cli status         # Show detailed status
statik-cli logs           # View server logs
```

### Configuration
```bash
statik-cli config         # Interactive configuration
statik-cli config token   # Set GitHub token for Copilot
statik-cli config list    # Show current configuration
statik-cli config reset   # Reset to defaults
```

### Mesh VPN Management
```bash
statik-cli mesh           # Show mesh status
statik-cli mesh key       # Generate new preauth key
statik-cli mesh devices   # List connected devices
statik-cli mesh remove    # Remove a device
```

### Utility Commands
```bash
statik-cli open           # Open server in default browser
statik-cli gui            # Launch interactive GUI
statik-cli build          # Rebuild components
statik-cli update         # Update to latest version
```

## 🤖 GitHub Copilot Integration

Statik-Server comes with GitHub Copilot Chat pre-configured for AI-powered development.

### Initial Setup
1. Start Statik-Server: `statik`
2. Open VS Code in your browser
3. You'll be prompted to sign in to GitHub
4. Authorize GitHub Copilot access
5. Start coding with AI assistance!

### Manual Token Setup
```bash
# Set GitHub token for Copilot
statik-cli config token

# Or set environment variable
export GITHUB_TOKEN="ghp_your_token_here"
statik
```

### Using Copilot Chat
- **Command Palette**: Ctrl+Shift+P → "GitHub Copilot Chat"
- **Sidebar**: Click the chat icon in the sidebar
- **Inline**: Use Ctrl+I for inline suggestions
- **Voice**: Use Ctrl+Alt+V for voice commands (if enabled)

## 🌐 Mesh VPN Usage

### Connecting Additional Devices

1. **Generate a preauth key**:
```bash
statik-cli mesh key
# Returns: statik_mesh_key_abc123...
```

2. **Install Tailscale on target device**:
```bash
# Linux
curl -fsSL https://tailscale.com/install.sh | sh

# macOS
brew install tailscale

# Windows: Download from tailscale.com
```

3. **Connect to your mesh**:
```bash
sudo tailscale up --login-server https://[your-server]:8443 --authkey statik_mesh_key_abc123...
```

4. **Access your development environment** from the new device using the mesh IP

### Managing Connected Devices
```bash
# List all devices in mesh
statik-cli mesh devices

# Remove a device
statik-cli mesh remove [device-name]

# Show mesh network status
statik-cli mesh status
```

## 🔧 Advanced Configuration

### Environment Variables
```bash
export STATIK_PORT=3000              # Change VS Code port
export STATIK_HTTPS_PORT=8443        # Change HTTPS port  
export STATIK_DOMAIN="dev.local"     # Change domain name
export STATIK_WORKSPACE="/workspace" # Change default workspace
export GITHUB_TOKEN="ghp_..."        # GitHub token for Copilot
```

### Custom Extensions
```bash
# Install VS Code extensions via CLI
statik-cli ext install ms-python.python
statik-cli ext install ms-vscode.vscode-typescript-next

# List installed extensions
statik-cli ext list

# Extensions are persisted in ~/.statik-server/extensions/
```

### Custom Settings
VS Code settings are stored in `~/.statik-server/data/User/settings.json`

Example custom settings:
```json
{
  "workbench.colorTheme": "Dark+ (default dark)",
  "editor.fontSize": 14,
  "github.copilot.enable": {
    "*": true,
    "yaml": true,
    "plaintext": true,
    "markdown": true
  },
  "github.copilot.chat.enable": true
}
```

## 📊 Monitoring and Debugging

### Server Status
```bash
statik-cli status
```
Shows:
- Server running status and PID
- Uptime and system load
- Memory usage
- Port information
- Mesh VPN status

### Logs
```bash
# View live logs
statik-cli logs

# View specific number of lines
statik-cli logs --lines 100

# Follow logs in real-time
statik-cli logs --follow

# View mesh VPN logs specifically
statik-cli mesh logs
```

### Performance Monitoring
```bash
# System resource usage
statik-cli status

# VS Code server metrics
curl http://localhost:8080/metrics

# Mesh VPN metrics (if enabled)
curl http://localhost:9090/metrics
```

## 🔄 Updates and Maintenance

### Updating Statik-Server
```bash
# Update to latest version
statik-cli update

# Update specific components
statik-cli update vscode     # Update VS Code CLI
statik-cli update mesh       # Update mesh components
```

### Backup and Restore
```bash
# Backup configuration and data
tar -czf statik-backup.tar.gz ~/.statik-server/

# Restore from backup
tar -xzf statik-backup.tar.gz -C ~/
```

### Reset to Default
```bash
# Reset configuration (keeps data)
statik-cli config reset

# Complete reset (WARNING: loses all data)
rm -rf ~/.statik-server/
./install.sh
```

## 🔗 Integration Examples

### CI/CD Pipeline Access
```bash
# Add CI server to mesh
statik-cli mesh key --name ci-server
# Use key in CI configuration to access development environment
```

### Team Development
```bash
# Share preauth key with team members
statik-cli mesh key --name team-member-john

# Team member connects
tailscale up --login-server https://[your-server]:8443 --authkey [shared-key]

# Now John can access your development environment securely
```

### Mobile Development Workflow
1. Start Statik-Server on development machine
2. Connect phone to same network or mesh VPN
3. Scan QR code displayed on startup
4. Develop and test directly on mobile device

## 🆘 Troubleshooting

### Common Issues

**Server won't start**
```bash
# Check if port is in use
netstat -tlnp | grep 8080

# Check logs for errors
statik-cli logs

# Try different port
STATIK_PORT=3000 statik-cli start
```

**Can't access from network**
```bash
# Check firewall settings
sudo ufw status
sudo ufw allow 8080

# Verify server is listening on all interfaces
netstat -tlnp | grep 0.0.0.0:8080
```

**Mesh VPN not working**
```bash
# Check mesh status
statik-cli mesh status

# Restart mesh components
statik-cli restart

# Check mesh logs
statik-cli mesh logs
```

**GitHub Copilot not working**
```bash
# Verify token is set
statik-cli config list | grep github

# Re-authenticate
statik-cli config token

# Check Copilot status in VS Code
# Command Palette → "GitHub Copilot: Check Status"
```

## 📚 Additional Resources

- [Installation Guide](./INSTALL.md) - Setting up Statik-Server
- [Mesh Overview](./mesh/MESH_OVERVIEW.md) - Understanding mesh networking
- [Development Guide](./development/STRUCTURE.md) - For contributors
- [GitHub Repository](https://github.com/statikfintechllc/AscendNet) - Source code and issues
