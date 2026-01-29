#!/bin/bash
set -e

# ============================================================================
# Claude Code Server - Railway Entrypoint
# Handles permission fix, optional user switching, and CLI installations
# https://github.com/sphinxcode/claude-code-server
# ============================================================================

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║        Claude Code Server - AI Coding Assistants Ready              ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# CONFIGURABLE PATHS AND USER
# ============================================================================

CLAUDER_HOME="${CLAUDER_HOME:-/home/clauder}"
CLAUDER_UID="${CLAUDER_UID:-1000}"
CLAUDER_GID="${CLAUDER_GID:-1000}"

# RUN_AS_USER: Set to "clauder" to run as non-root, or "root" (default) to stay as root
RUN_AS_USER="${RUN_AS_USER:-root}"

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
    # OPTIONAL CLI INSTALLATIONS
    # Install CLIs based on environment variables (only if not already present)
    # ========================================================================
    
    echo ""
    echo "→ Checking optional CLI installations..."
    
    # OpenCode
    if [ "${INSTALL_OPENCODE:-0}" = "1" ]; then
        if ! command -v opencode &>/dev/null; then
            echo "  → Installing OpenCode..."
            curl -fsSL https://raw.githubusercontent.com/opencode-ai/opencode/refs/heads/main/install | bash || echo "  ⚠ OpenCode install failed"
        else
            echo "  ✓ OpenCode already installed"
        fi
    fi
    
    # Gemini CLI
    if [ "${INSTALL_GEMINI:-0}" = "1" ]; then
        if ! command -v gemini &>/dev/null; then
            echo "  → Installing Gemini CLI..."
            npm install -g @google/gemini-cli || echo "  ⚠ Gemini CLI install failed"
        else
            echo "  ✓ Gemini CLI already installed"
        fi
    fi
    
    # KiloCode CLI
    if [ "${INSTALL_KILOCODE:-0}" = "1" ]; then
        if ! command -v kilocode &>/dev/null; then
            echo "  → Installing KiloCode CLI..."
            npm install -g @kilocode/cli || echo "  ⚠ KiloCode CLI install failed"
        else
            echo "  ✓ KiloCode CLI already installed"
        fi
    fi
    
    # Continue CLI
    if [ "${INSTALL_CONTINUE:-0}" = "1" ]; then
        if ! command -v continue &>/dev/null; then
            echo "  → Installing Continue CLI..."
            npm install -g @continuedev/cli || echo "  ⚠ Continue CLI install failed"
        else
            echo "  ✓ Continue CLI already installed"
        fi
    fi
    
    # Codex CLI
    if [ "${INSTALL_CODEX:-0}" = "1" ]; then
        if ! command -v codex &>/dev/null; then
            echo "  → Installing Codex CLI..."
            npm install -g @openai/codex || echo "  ⚠ Codex CLI install failed"
        else
            echo "  ✓ Codex CLI already installed"
        fi
    fi
    
    # ========================================================================
    # OPTIONAL DEVELOPMENT FRAMEWORK INSTALLATIONS
    # ========================================================================
    
    # BMAD Method
    if [ "${INSTALL_BMAD:-0}" = "1" ]; then
        echo "  → Installing BMAD Method..."
        npx bmad-method install || echo "  ⚠ BMAD install failed"
    fi
    
    # OpenSpec
    if [ "${INSTALL_OPENSPEC:-0}" = "1" ]; then
        if ! command -v openspec &>/dev/null; then
            echo "  → Installing OpenSpec..."
            npm install -g @fission-ai/openspec@latest || echo "  ⚠ OpenSpec install failed"
        else
            echo "  ✓ OpenSpec already installed"
        fi
    fi
    
    # Spec-Kit
    if [ "${INSTALL_SPECKIT:-0}" = "1" ]; then
        if ! command -v specify &>/dev/null; then
            echo "  → Installing Spec-Kit..."
            uv tool install specify-cli --from git+https://github.com/github/spec-kit.git || echo "  ⚠ Spec-Kit install failed"
        else
            echo "  ✓ Spec-Kit already installed"
        fi
    fi
    
    # ========================================================================
    # SHELL PROFILE SETUP
    # ========================================================================
    
    PROFILE_FILE="$HOME/.bashrc"
    
    if [ ! -f "$PROFILE_FILE" ] || ! grep -q '.local/bin' "$PROFILE_FILE" 2>/dev/null; then
        echo "→ Setting up shell profile..."
        cat >> "$PROFILE_FILE" << 'PROFILE'

# ============================================================================
# Claude Code Server - PATH Configuration
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

FIRST_RUN_MARKER="$XDG_DATA_HOME/.claude-code-server-initialized"

if [ ! -f "$FIRST_RUN_MARKER" ]; then
    echo "→ First run detected - initializing..."

    if [ ! -f "$HOME/workspace/README.md" ]; then
        cat > "$HOME/workspace/README.md" << 'WELCOME'
# Welcome to Claude Code Server

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

## Claude Code Authentication

⚠️ **Important**: When authenticating Claude Code:
1. Copy the authentication URL
2. Open it in a **different browser** (not this code-server browser)
3. Complete the login there
4. Copy the code and paste it back into the CLI

Your credentials persist across redeployments.

## Configuration

Set these environment variables in Railway:

- `RUN_AS_USER=clauder` - Run as non-root user (recommended)
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

# Claude Code - show source (always installed)
if [ -x "$CLAUDER_HOME/.local/bin/claude" ]; then
    echo "  → claude: $(claude --version 2>/dev/null || echo 'installed') [volume ~/.local/bin]"
elif [ -x "$CLAUDER_HOME/.claude/local/claude" ]; then
    echo "  → claude: $(claude --version 2>/dev/null || echo 'installed') [volume ~/.claude/local]"
elif command -v claude &>/dev/null; then
    echo "  → claude: $(claude --version 2>/dev/null || echo 'installed') [image]"
else
    echo "  → claude: not installed"
fi

# Show optional CLIs if installed
command -v opencode &>/dev/null && echo "  → opencode: installed"
command -v gemini &>/dev/null && echo "  → gemini: installed"
command -v kilocode &>/dev/null && echo "  → kilocode: installed"
command -v continue &>/dev/null && echo "  → continue: installed"
command -v codex &>/dev/null && echo "  → codex: installed"

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

exec dumb-init /usr/bin/code-server --bind-addr 0.0.0.0:8080 "$HOME/workspace"
