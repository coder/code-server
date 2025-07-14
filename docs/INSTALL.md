# Statik-Server Installation Guide

## Quick Install

```bash
curl -sSL https://raw.githubusercontent.com/statikfintechllc/AscendNet/master/statik-server/install.sh | bash
```

## Manual Installation

1. Clone the repository:
```bash
git clone https://github.com/statikfintechllc/AscendNet.git
cd AscendNet/statik-server
```

2. Run the installer:
```bash
./install.sh
```

## Post-Installation

After installation, you can:
- Start the server: `statik`
- Use the CLI: `statik-cli start`
- Launch GUI: `statik-cli gui`
- View status: `statik-cli status`

## Dependencies

The installer automatically installs:
- Node.js & npm/pnpm
- Go compiler
- Docker
- OpenSSL & certificates
- QR code generator
- VS Code CLI

## Directory Structure

```
~/.statik-server/
├── config/          # Configuration files
├── keys/            # Certificates and auth keys
├── logs/            # Server logs
├── data/            # VS Code user data
└── extensions/      # VS Code extensions
```
