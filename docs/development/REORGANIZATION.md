# Statik-Server Repository Reorganization

## Summary of Changes

The statik-server repository has been fully reorganized with a clean, professional directory structure and updated path references throughout.

## New Directory Structure

### 🔧 Core Organization

```
statik-server/
├── app/                    # Application Interface
│   ├── cli/               # Command-line tools
│   ├── gui/               # GUI components (future)  
│   ├── icons/             # Application icons
│   └── install-app.sh     # Desktop app installer
├── scripts/               # Build & Runtime Scripts
│   ├── build.sh           # Main build script
│   ├── startup.sh         # Server startup
│   ├── mesh-start.sh      # Mesh VPN startup
│   ├── quick-build.sh     # Quick build and run
│   └── test-setup.sh      # Test setup
├── config/                # Configuration (future)
├── docs/user/             # User Documentation
└── setup.sh               # Main installer
```

### 📱 App Interface (`/app/`)

**Moved Files:**
- `install-app.sh` → `app/install-app.sh`
- `statik-cli` → `app/cli/statik-cli`
- `APP_INTERFACE.md` → `docs/user/APP_INTERFACE.md`
- Icons → `app/icons/`

**Features:**
- State-of-the-art CLI with direct commands
- Interactive GUI with system monitoring
- Desktop integration with application menu
- Full pre-launch and runtime control

### 🔧 Scripts (`/scripts/`)

**Moved Files:**
- `build.sh` → `scripts/build.sh`
- `startup.sh` → `scripts/startup.sh`
- `mesh-start.sh` → `scripts/mesh-start.sh`
- `quick-build.sh` → `scripts/quick-build.sh`
- `test-setup.sh` → `scripts/test-setup.sh`

**Updated Paths:**
- All scripts now work from repository root
- Cross-references updated between scripts
- Relative path calculations fixed

## Installation & Usage

### 🚀 Quick Start

```bash
# Clone and setup
git clone https://github.com/statikfintechllc/statik-server.git
cd statik-server
./setup.sh

# Build and run
statik-cli build
statik-cli start
statik-cli status
```

### 💻 CLI Commands

```bash
# Direct commands
statik-cli start          # Start server
statik-cli stop           # Stop server
statik-cli status         # Check status
statik-cli logs           # View logs
statik-cli config token   # Set GitHub token

# Interactive GUI
statik-server             # Launch interactive menu
```

### 📱 Desktop Integration

When installed via `./setup.sh`:

```
~/.local/share/applications/
├── Statik-Server.desktop      # Desktop entry
└── statik_cli.sh              # Interactive GUI

~/.local/share/icons/
└── statik-server.png           # Application icon

~/.local/bin/
├── statik-server               # GUI launcher  
└── statik-cli                  # Direct CLI
```

## Updated Path References

### ✅ Fixed Scripts

1. **startup.sh**
   - Updated mesh startup paths
   - Fixed relative directory navigation
   - Corrected working directory handling

2. **build.sh**  
   - Dynamic root directory detection
   - Updated STATIK_ROOT calculation
   - Fixed working directory context

3. **install-app.sh**
   - Updated icon path detection
   - Fixed STATIK_DIR resolution
   - Updated script path references

4. **statik-cli**
   - Dynamic statik-server directory detection
   - Smart path resolution for installed vs repo usage
   - Updated script references

### ✅ Updated Documentation

1. **README.md**
   - Updated installation instructions
   - Added desktop app interface section
   - Fixed command examples

2. **APP_INTERFACE.md** → `docs/user/APP_INTERFACE.md`
   - Comprehensive CLI documentation
   - Usage examples and patterns
   - Integration examples

3. **STRUCTURE.md** (new)
   - Complete directory structure overview
   - Usage patterns and workflows
   - Standard Linux path conventions

## Benefits of Reorganization

### 🎯 Clear Separation of Concerns
- **App interface** in dedicated `/app/` directory
- **Build/runtime scripts** in `/scripts/`
- **User documentation** in `/docs/user/`

### 📁 Professional Structure
- Follows modern project conventions
- Intuitive navigation for developers
- Standard Linux filesystem hierarchy

### 🔧 Maintainable Paths
- Dynamic path resolution
- Works in development and installed environments
- Resilient to directory structure changes

### 🚀 Enhanced User Experience
- Single command installation (`./setup.sh`)
- Professional CLI interface (`statik-cli`)
- Desktop application integration
- Comprehensive documentation

## Migration Guide

### For Developers

**Old commands:**
```bash
./build.sh              # ❌ Old
./startup.sh             # ❌ Old
./install-app.sh         # ❌ Old
```

**New commands:**
```bash
./scripts/build.sh       # ✅ Direct script access
./scripts/startup.sh     # ✅ Direct script access
./setup.sh               # ✅ Main installer
statik-cli build         # ✅ Preferred CLI
statik-cli start         # ✅ Preferred CLI
```

### For Users

**Installation:**
```bash
git clone https://github.com/statikfintechllc/statik-server.git
cd statik-server
./setup.sh               # One-command setup
```

**Daily usage:**
```bash
statik-cli start         # Start server
statik-cli status        # Check status
statik-server            # Interactive GUI
```

This reorganization creates a professional, maintainable, and user-friendly structure that scales with the project's growth while maintaining backward compatibility through smart path resolution.
