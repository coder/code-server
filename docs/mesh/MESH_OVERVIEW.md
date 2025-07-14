# Statik Mesh VPN Overview

Statik-Server includes an integrated mesh VPN based on Headscale, providing secure global access to your development environment.

## Features

- **Zero-config networking**: Automatically configured mesh
- **Self-signed certificates**: No external CA required
- **Preauth keys**: Simple device onboarding
- **Global access**: Connect from anywhere
- **Encrypted tunnels**: All traffic is encrypted

## Architecture

```
Device A ←→ Statik Server ←→ Device B
    ↑           ↓              ↑
    └─────── Mesh VPN ─────────┘
```

## Setup

The mesh is automatically configured during installation. No manual setup required.

## Adding Devices

1. Generate a preauth key:
```bash
statik-cli mesh key
```

2. Connect your device:
```bash
tailscale up --login-server https://[server]:8443 --authkey [key]
```

3. Access your development environment from anywhere!

## Security

- All connections use WireGuard encryption
- Certificates are auto-generated and self-signed
- Keys are stored securely in `~/.statik-server/keys/`
- No external dependencies or cloud services
