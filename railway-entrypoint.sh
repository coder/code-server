#!/bin/bash
set -e

# ============================================================================
# VSCode Cloud IDE - Railway Entrypoint
# Robust entrypoint with volume-first tool priority
# ============================================================================

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║           VSCode Cloud IDE - Claude Code & Node.js Ready            ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# CONFIGURABLE PATHS
# Users can override CODER_HOME to change the volume mount point
# ============================================================================

CODER_HOME="${CODER_HOME:-/home/coder}"

export HOME="$CODER_HOME"
export XDG_DATA_HOME="$CODER_HOME/.local/share"
export XDG_CONFIG_HOME="$CODER_HOME/.config"
export XDG_CACHE_HOME="$CODER_HOME/.cache"
export XDG_STATE_HOME="$CODER_HOME/.local/state"

# PATH: Volume paths FIRST (user installs), image paths LAST (fallbacks)
export PATH="$CODER_HOME/.local/node/bin:$CODER_HOME/.claude/local:$CODER_HOME/.local/bin:$CODER_HOME/node_modules/.bin:/usr/local/bin:/usr/bin:/usr/lib/code-server/lib/vscode/bin/remote-cli:$PATH"

echo "→ User: $(whoami) (UID: $(id -u))"
echo "→ HOME: $HOME"

# ============================================================================
# DIRECTORY CREATION
# ============================================================================

create_dirs() {
    mkdir -p "$XDG_DATA_HOME" \
             "$XDG_CONFIG_HOME" \
             "$XDG_CACHE_HOME" \
             "$XDG_STATE_HOME" \
             "$HOME/.local/bin" \
             "$HOME/.local/node" \
             "$HOME/.claude" \
             "$HOME/entrypoint.d" \
             "$HOME/workspace" \
             "$XDG_DATA_HOME/code-server/extensions" \
             "$XDG_CONFIG_HOME/code-server" 2>/dev/null || true
}
create_dirs

# ============================================================================
# ROOT USER SYMLINKS
# When running as root, symlink /root directories to the volume
# ============================================================================

if [ "$(id -u)" = "0" ]; then
    echo "→ Running as root - creating persistence symlinks..."

    mkdir -p /root/.local 2>/dev/null || true

    for dir in ".local/share" ".local/node" ".config" ".cache" ".claude"; do
        target="$CODER_HOME/$dir"
        link="/root/$dir"

        if [ -d "$target" ] && [ ! -L "$link" ]; then
            rm -rf "$link" 2>/dev/null || true
            mkdir -p "$(dirname "$link")" 2>/dev/null || true
            ln -sf "$target" "$link" 2>/dev/null || true
        fi
    done

    echo "  ✓ Root directories symlinked to $CODER_HOME"
fi

# ============================================================================
# FIRST RUN SETUP
# ============================================================================

FIRST_RUN_MARKER="$XDG_DATA_HOME/.vscode-cloud-initialized"

if [ ! -f "$FIRST_RUN_MARKER" ]; then
    echo "→ First run detected - initializing..."

    mkdir -p "$XDG_CONFIG_HOME/code-server" 2>/dev/null || true

    if [ ! -f "$HOME/workspace/README.md" ]; then
        cat > "$HOME/workspace/README.md" << 'WELCOME' 2>/dev/null || true
# Welcome to VSCode Cloud IDE

Your cloud development environment is ready!

## Features

- **Claude Code CLI** - Pre-installed and ready to use
- **Node.js 20 LTS** - Pre-installed and ready to use
- **Persistent Extensions** - Install once, keep forever
- **Full Terminal** - npm, git, and more

## Quick Start

1. Open the Extensions panel (Ctrl+Shift+X)
2. Install your favorite extensions (they persist!)
3. Start coding in this workspace

## Using Claude Code

```bash
claude
```

You'll need to authenticate with your Anthropic API key on first use.

Happy coding! 🚀
WELCOME
    fi

    touch "$FIRST_RUN_MARKER" 2>/dev/null || true
    echo "  ✓ Initialization complete"
fi

# ============================================================================
# ENVIRONMENT VERIFICATION
# Shows which version is being used (volume vs image)
# ============================================================================

echo ""
echo "Environment:"

# Node.js - show source
if [ -x "$CODER_HOME/.local/node/bin/node" ]; then
    echo "  → Node.js: $(node --version 2>/dev/null) [volume]"
else
    echo "  → Node.js: $(node --version 2>/dev/null || echo 'not found') [image]"
fi

# npm
echo "  → npm: $(npm --version 2>/dev/null || echo 'not found')"

# git
echo "  → git: $(git --version 2>/dev/null | cut -d' ' -f3 || echo 'not found')"

# Claude Code - show source
if [ -x "$CODER_HOME/.claude/local/claude" ]; then
    echo "  → claude: $(claude --version 2>/dev/null || echo 'installed') [volume]"
elif command -v claude &>/dev/null; then
    echo "  → claude: $(claude --version 2>/dev/null || echo 'installed') [image]"
else
    echo "  → claude: not installed"
fi

# Extensions count
if [ -d "$XDG_DATA_HOME/code-server/extensions" ]; then
    EXT_COUNT=$(find "$XDG_DATA_HOME/code-server/extensions" -maxdepth 1 -type d 2>/dev/null | wc -l)
    EXT_COUNT=$((EXT_COUNT - 1))
    if [ $EXT_COUNT -gt 0 ]; then
        echo "  → Extensions: $EXT_COUNT installed"
    fi
fi

# ============================================================================
# CUSTOM STARTUP SCRIPTS
# ============================================================================

if [ -d "$HOME/entrypoint.d" ]; then
    for script in "$HOME/entrypoint.d"/*.sh; do
        if [ -f "$script" ] && [ -x "$script" ]; then
            echo ""
            echo "Running: $(basename "$script")"
            "$script" || echo "  ⚠ Script exited with code $?"
        fi
    done
fi

# ============================================================================
# START CODE-SERVER
# ============================================================================

echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo "Starting code-server..."
echo "════════════════════════════════════════════════════════════════════════"
echo ""

exec dumb-init /usr/bin/code-server "$@"
