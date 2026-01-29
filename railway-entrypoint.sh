#!/bin/bash
set -e

# ============================================================================
# VSCode Cloud IDE - Railway Entrypoint
# Handles permission fix and optional user switching
# ============================================================================

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║           VSCode Cloud IDE - Claude Code & Node.js Ready            ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# CONFIGURABLE PATHS AND USER
# ============================================================================

CLAUDER_HOME="${CLAUDER_HOME:-/home/clauder}"
CLAUDER_UID="${CLAUDER_UID:-1000}"
CLAUDER_GID="${CLAUDER_GID:-1000}"

# RUN_AS_USER: Defaults to "clauder" for non-root. Set to "root" if needed.
RUN_AS_USER="${RUN_AS_USER:-clauder}"

export HOME="$CLAUDER_HOME"
export XDG_DATA_HOME="$CLAUDER_HOME/.local/share"
export XDG_CONFIG_HOME="$CLAUDER_HOME/.config"
export XDG_CACHE_HOME="$CLAUDER_HOME/.cache"
export XDG_STATE_HOME="$CLAUDER_HOME/.local/state"

# PATH: Include ~/.local/bin where Claude installs by default
export PATH="$CLAUDER_HOME/.local/bin:$CLAUDER_HOME/.local/node/bin:$CLAUDER_HOME/.claude/local:$CLAUDER_HOME/node_modules/.bin:/usr/local/bin:/usr/bin:/usr/lib/code-server/lib/vscode/bin/remote-cli:$PATH"

echo "→ Initial user: $(whoami) (UID: $(id -u))"
echo "→ RUN_AS_USER: $RUN_AS_USER"
echo "→ HOME: $HOME"

# ============================================================================
# DIRECTORY CREATION AND PERMISSION FIX
# ============================================================================

if [ "$(id -u)" = "0" ]; then
    echo ""
    echo "→ Running setup as root..."
    
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
    # ========================================================================
    
    PROFILE_FILE="$HOME/.bashrc"
    
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
    
    # ========================================================================
    # USER SWITCHING (if RUN_AS_USER=clauder)
    # ========================================================================
    
    if [ "$RUN_AS_USER" = "clauder" ]; then
        echo "→ Fixing permissions for clauder user (UID: $CLAUDER_UID)..."
        chown -R "$CLAUDER_UID:$CLAUDER_GID" "$CLAUDER_HOME" 2>/dev/null || true
        echo "  ✓ Permissions fixed"
        
        # Check if gosu is available
        if command -v gosu &>/dev/null; then
            echo "→ Switching to clauder user via gosu..."
            exec gosu "$CLAUDER_UID:$CLAUDER_GID" "$0" "$@"
        else
            echo "  ⚠ gosu not found, staying as root"
        fi
    else
        echo "→ Staying as root (set RUN_AS_USER=clauder to switch)"
        
        # Create symlinks from /root to volume for persistence
        mkdir -p /root/.local 2>/dev/null || true
        for dir in ".local/share" ".local/bin" ".local/node" ".config" ".cache" ".claude"; do
            target="$CLAUDER_HOME/$dir"
            link="/root/$dir"
            if [ -d "$target" ] && [ ! -L "$link" ]; then
                rm -rf "$link" 2>/dev/null || true
                mkdir -p "$(dirname "$link")" 2>/dev/null || true
                ln -sf "$target" "$link" 2>/dev/null || true
            fi
        done
        echo "  ✓ Root directories symlinked to $CLAUDER_HOME"
    fi
fi

# ============================================================================
# RUNNING AS FINAL USER
# ============================================================================

echo ""
echo "→ Running as: $(whoami) (UID: $(id -u))"

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

## Configuration

Set these environment variables in Railway:

- `RUN_AS_USER=coder` - Run as non-root user (recommended for Claude)
- `RUN_AS_USER=root` - Stay as root (default)

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
if [ -x "$CLAUDER_HOME/.local/node/bin/node" ]; then
    echo "  → Node.js: $(node --version 2>/dev/null) [volume]"
else
    echo "  → Node.js: $(node --version 2>/dev/null || echo 'not found') [image]"
fi

# npm
echo "  → npm: $(npm --version 2>/dev/null || echo 'not found')"

# git
echo "  → git: $(git --version 2>/dev/null | cut -d' ' -f3 || echo 'not found')"

# Claude Code - show source
if [ -x "$CLAUDER_HOME/.local/bin/claude" ]; then
    echo "  → claude: $(claude --version 2>/dev/null || echo 'installed') [volume ~/.local/bin]"
elif [ -x "$CLAUDER_HOME/.claude/local/claude" ]; then
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

exec dumb-init /usr/bin/code-server --bind-addr 0.0.0.0:8080 /home/coder/workspace
