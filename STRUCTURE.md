# Statik-Server Directory Structure

This document outlines the organized directory structure for Statik-Server.

## Root Structure

```
statik-server/
├── app/                    # Application interface
│   ├── cli/               # CLI tools
│   │   └── statik-cli     # Direct command interface
│   ├── gui/               # GUI components (future)
│   ├── icons/             # Application icons
│   │   └── statik-server.png
│   └── install-app.sh     # App installer
├── scripts/               # Build and runtime scripts
│   ├── build.sh           # Main build script
│   ├── startup.sh         # Server startup
│   ├── mesh-start.sh      # Mesh VPN startup
│   ├── quick-build.sh     # Quick build and run
│   └── test-setup.sh      # Test setup
├── config/                # Configuration files (future)
├── docs/                  # Documentation
│   ├── user/              # User documentation
│   │   └── APP_INTERFACE.md
│   └── ...                # Other docs
├── src/                   # Source code
├── lib/                   # Built libraries
├── internal/              # Internal components
├── ci/                    # CI/CD scripts
├── test/                  # Tests
├── setup.sh               # Main installer
├── README.md              # Main documentation
└── ...                    # Config files
```

## Key Directories

### `/app/` - Application Interface
Contains all user-facing application components:
- **cli/**: Command-line interface tools
- **gui/**: Future GUI components  
- **icons/**: Application icons for desktop integration
- **install-app.sh**: Desktop app installer

### `/scripts/` - Build & Runtime
Contains all build and runtime scripts:
- **build.sh**: Main build script
- **startup.sh**: Server startup script
- **mesh-start.sh**: Mesh VPN startup
- **quick-build.sh**: Quick build and run
- **test-setup.sh**: Test environment setup

### `/docs/user/` - User Documentation
User-facing documentation:
- **APP_INTERFACE.md**: Complete app interface guide

## Installation Paths

When installed, files are placed in standard Linux locations:

```
~/.local/share/applications/
├── Statik-Server.desktop      # Desktop entry
└── statik_cli.sh              # Interactive GUI script

~/.local/share/icons/
└── statik-server.png           # Application icon

~/.local/bin/
├── statik-server               # GUI launcher
└── statik-cli                  # Direct CLI commands
```

## Usage Patterns

### Developer Workflow
```bash
# One-time setup
git clone https://github.com/statikfintechllc/statik-server.git
cd statik-server
./setup.sh

# Daily usage
statik-cli start
statik-cli status
statik-cli logs
```

### Directory Navigation
```bash
# Build scripts
cd scripts/
./build.sh

# App interface
cd app/
./install-app.sh

# Documentation
cd docs/user/
cat APP_INTERFACE.md
```

This structure provides:
- **Clear separation** of concerns
- **Organized tooling** in dedicated directories
- **Standardized paths** following Linux conventions
- **Intuitive navigation** for developers and users
