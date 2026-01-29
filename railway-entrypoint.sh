#!/bin/bash
set -e

# ============================================================================
# VSCode Cloud IDE - Railway Entrypoint
# Handles permission fix and user switching for non-root execution
# ============================================================================

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║           VSCode Cloud IDE - Claude Code & Node.js Ready            ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# CONFIGURABLE PATHS
# ============================================================================

CODER_HOME="${CODER_HOME:-/home/coder}"
CODER_UID="${CODER_UID:-1000}"
CODER_GID="${CODER_GID:-1000}"

export HOME="$CODER_HOME"
export XDG_DATA_HOME="$CODER_HOME/.local/share"
export XDG_CONFIG_HOME="$CODER_HOME/.config"
export XDG_CACHE_HOME="$CODER_HOME/.cache"
export XDG_STATE_HOME="$CODER_HOME/.local/state"

# PATH: Include ~/.local/bin where Claude installs by default
export PATH="$CODER_HOME/.local/bin:$CODER_HOME/.local/node/bin:$CODER_HOME/.claude/local:$CODER_HOME/node_modules/.bin:/usr/local/bin:/usr/bin:/usr/lib/code-server/lib/vscode/bin/remote-cli:$PATH"

# ============================================================================
# PERMISSION FIX (runs as root, then switches to coder)
# ============================================================================

if [ "$(id -u)" = "0" ]; then
    echo "→ Running initial setup as root..."
    
    # Create directories if they don't exist
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
    
    # ========================================================================
    # SHELL PROFILE SETUP
    # Ensure PATH includes ~/.local/bin for Claude and other user tools
    # ========================================================================
    
    PROFILE_FILE="$HOME/.bashrc"
    PATH_EXPORT='export PATH="$HOME/.local/bin:$HOME/.local/node/bin:$PATH"'
    
    if [ ! -f "$PROFILE_FILE" ] || ! grep -q '.local/bin' "$PROFILE_FILE" 2>/dev/null; then
        echo "→ Setting up shell profile..."
        cat >> "$PROFILE_FILE" << 'PROFILE'

# ============================================================================
# VSCode Cloud IDE - PATH Configuration
# ============================================================================
export PATH="$HOME/.local/bin:$HOME/.local/node/bin:$HOME/.claude/local:$PATH"

# Claude Code alias with --dangerously-skip-permissions
alias claude-auto='claude --dangerously-skip-permissions'
PROFILE
        echo "  ✓ Shell profile configured"
    fi
    
    # Also set up .profile for login shells
    if [ ! -f "$HOME/.profile" ] || ! grep -q '.local/bin' "$HOME/.profile" 2>/dev/null; then
        cat >> "$HOME/.profile" << 'PROFILE'

# Load .bashrc for interactive shells
if [ -f "$HOME/.bashrc" ]; then
    . "$HOME/.bashrc"
fi
PROFILE
    fi
    
    # Fix ownership on the entire home directory
    echo "→ Fixing permissions for coder user (UID: $CODER_UID)..."
    chown -R "$CODER_UID:$CODER_GID" "$CODER_HOME" 2>/dev/null || true
    
    echo "  ✓ Permissions fixed"
    echo ""
    
    # Re-exec this script as coder user using gosu
    echo "→ Switching to coder user..."
    exec gosu "$CODER_UID:$CODER_GID" "$0" "$@"
fi

# ============================================================================
# RUNNING AS CODER USER FROM HERE
# ============================================================================

echo "→ User: $(whoami) (UID: $(id -u))"
echo "→ HOME: $HOME"

# ============================================================================
# FIRST RUN SETUP
# ============================================================================

FIRST_RUN_MARKER="$XDG_DATA_HOME/.vscode-cloud-initialized"

if [ ! -f "$FIRST_RUN_MARKER" ]; then
    echo "→ First run detected - initializing..."

    if [ ! -f "$HOME/workspace/README.md" ]; then
        cat > "$HOME/workspace/README.md" << 'WELCOME'
# Welcome to VSCode Cloud IDE

Your cloud development environment is ready!

## Features

- **Claude Code CLI** - Pre-installed and ready to use
- **Node.js 20 LTS** - Pre-installed and ready to use
- **Persistent Extensions** - Install once, keep forever
- **Full Terminal** - npm, git, and more

## Quick Start

```bash
# Start Claude Code (with auto-accept for automation)
claude --dangerously-skip-permissions

# Or use the alias
claude-auto

# Interactive mode
claude
```

You'll need to authenticate with your Anthropic API key on first use.

## Persist Claude Authentication

Your Claude config at `~/.claude/` persists across redeployments.
After authenticating once, you won't need to re-authenticate.

Happy coding! 🚀
WELCOME
    fi

    touch "$FIRST_RUN_MARKER" 2>/dev/null || true
    echo "  ✓ Initialization complete"
fi

# ============================================================================
# ENVIRONMENT VERIFICATION
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

# Claude Code - show source (check ~/.local/bin first, then ~/.claude/local, then /usr/local/bin)
if [ -x "$CODER_HOME/.local/bin/claude" ]; then
    echo "  → claude: $(claude --version 2>/dev/null || echo 'installed') [volume ~/.local/bin]"
elif [ -x "$CODER_HOME/.claude/local/claude" ]; then
    echo "  → claude: $(claude --version 2>/dev/null || echo 'installed') [volume ~/.claude/local]"
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
echo "Starting code-server as $(whoami)..."
echo "════════════════════════════════════════════════════════════════════════"
echo ""

exec dumb-init /usr/bin/code-server "$@"
