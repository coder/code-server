# Statik-Server App Interface

This directory provides a comprehensive desktop application interface for Statik-Server with state-of-the-art CLI capabilities.

## Installation

```bash
./install-app.sh
```

This installs:
- Desktop application entry with icon
- Interactive GUI CLI (`statik-server`)
- Direct command CLI (`statik-cli`)
- System integration with `$HOME/.local/share/applications`
- Icon placement in `$HOME/.local/share/icons`

## Usage

### Direct CLI Commands

```bash
# Quick commands
statik-cli start              # Start the server
statik-cli stop               # Stop the server  
statik-cli status             # Check status
statik-cli logs               # View logs
statik-cli open               # Open in browser

# Configuration
statik-cli config token       # Set GitHub token
statik-cli config show        # Show current config
statik-cli config reset       # Reset configuration

# Management
statik-cli build              # Build/update server
statik-cli restart            # Restart server
statik-cli mesh status        # Check mesh VPN
```

### Interactive GUI

```bash
statik-server                 # Launch interactive menu
```

Or find "Statik-Server" in your application menu.

### Advanced Usage

```bash
# View logs with options
statik-cli logs --tail 100    # Last 100 lines
statik-cli logs --follow      # Follow log output

# Verbose output
statik-cli -v start           # Verbose start

# Quiet mode
statik-cli -q stop            # Quiet stop
```

## Features

### State-of-the-Art CLI
- **Direct Commands**: Full control via command line
- **Interactive Mode**: GUI-style menus in terminal
- **Color Output**: Beautiful formatted output
- **Error Handling**: Comprehensive error messages
- **Verbose/Quiet Modes**: Flexible output control

### System Integration
- **Desktop Entry**: Appears in application menus
- **Icon Integration**: Custom icon in system icons
- **PATH Integration**: Commands available system-wide
- **Shell Completion**: Tab completion support

### Monitoring & Control
- **Real-time Status**: System resource monitoring
- **Process Management**: PID tracking and control
- **Port Monitoring**: Service port status
- **Log Management**: Comprehensive log viewing

### Configuration Management
- **GitHub Token**: Secure token storage
- **Mesh VPN Keys**: Auth key management
- **Reset Options**: Clean configuration reset
- **Status Display**: Current config overview

## Architecture

```
Statik-Server App Interface
├── install-app.sh           # Main installer
├── statik-cli               # Direct CLI commands
└── Generated Files:
    ├── ~/.local/share/applications/
    │   ├── Statik-Server.desktop     # Desktop entry
    │   └── statik_cli.sh             # Interactive GUI
    ├── ~/.local/share/icons/
    │   └── statik-server.png         # Application icon
    └── ~/.local/bin/
        ├── statik-server             # GUI launcher
        └── statik-cli                # Direct CLI
```

## Commands Reference

| Command | Description | Example |
|---------|-------------|---------|
| `start` | Start Statik-Server | `statik-cli start` |
| `stop` | Stop Statik-Server | `statik-cli stop` |
| `restart` | Restart Statik-Server | `statik-cli restart` |
| `status` | Show server status | `statik-cli status` |
| `logs` | View server logs | `statik-cli logs --tail 50` |
| `build` | Build/update server | `statik-cli build` |
| `config` | Manage configuration | `statik-cli config token` |
| `mesh` | Mesh VPN management | `statik-cli mesh status` |
| `open` | Open in browser | `statik-cli open` |
| `gui` | Launch interactive GUI | `statik-cli gui` |
| `install` | Install desktop app | `statik-cli install` |
| `uninstall` | Remove desktop app | `statik-cli uninstall` |

## Integration Examples

### Systemd Service
```bash
# Create service that uses CLI
sudo tee /etc/systemd/system/statik-server.service << EOF
[Unit]
Description=Statik-Server
After=network.target

[Service]
Type=forking
User=$USER
ExecStart=/home/$USER/.local/bin/statik-cli start
ExecStop=/home/$USER/.local/bin/statik-cli stop
Restart=always

[Install]
WantedBy=multi-user.target
EOF
```

### Desktop Automation
```bash
# Auto-start on login
echo "statik-cli start" >> ~/.profile
```

### Shell Integration
```bash
# Add to .bashrc/.zshrc for status in prompt
export PS1="$(statik-cli status --quiet && echo '🟢' || echo '🔴') $PS1"
```

This provides a complete, professional-grade application interface that matches modern CLI tools like Docker, Kubernetes CLI, and other state-of-the-art development tools.
