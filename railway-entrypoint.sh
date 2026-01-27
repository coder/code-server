#!/bin/bash
set -e

# Railway runs containers as root, but we want all data in /home/coder (the volume)
# This script ensures proper environment setup for persistence

echo "=== Railway Code-Server Startup ==="
echo "User: $(whoami) (UID: $(id -u))"
echo "HOME: $HOME"
echo "XDG_DATA_HOME: $XDG_DATA_HOME"
echo "XDG_CONFIG_HOME: $XDG_CONFIG_HOME"

# Ensure HOME is set correctly (Railway might override it)
export HOME=/home/coder

# Ensure XDG directories exist and are writable
mkdir -p "$XDG_DATA_HOME" "$XDG_CONFIG_HOME" "$XDG_CACHE_HOME" "$XDG_STATE_HOME"
mkdir -p "$HOME/.local/bin" "$HOME/entrypoint.d"

# Ensure the code-server data directory exists
mkdir -p "$XDG_DATA_HOME/code-server"

# Set up VS Code Server data directory symlink if running as root
# This ensures extensions installed by code-server persist
if [ "$(id -u)" = "0" ]; then
    # Create root's directories pointing to volume
    mkdir -p /root/.local

    # Symlink root's local share to the volume (for VS Code extensions)
    if [ ! -L /root/.local/share ]; then
        rm -rf /root/.local/share 2>/dev/null || true
        ln -sf "$XDG_DATA_HOME" /root/.local/share
    fi

    # Symlink root's config to the volume
    if [ ! -L /root/.config ]; then
        rm -rf /root/.config 2>/dev/null || true
        ln -sf "$XDG_CONFIG_HOME" /root/.config
    fi

    # Symlink root's cache to the volume
    if [ ! -L /root/.cache ]; then
        rm -rf /root/.cache 2>/dev/null || true
        ln -sf "$XDG_CACHE_HOME" /root/.cache
    fi

    echo "Created symlinks from /root to $HOME for persistence"
fi

# Ensure Node.js is accessible
echo "Node.js version: $(node --version 2>/dev/null || echo 'Not found in PATH')"
echo "npm version: $(npm --version 2>/dev/null || echo 'Not found in PATH')"
echo "PATH: $PATH"

# Run any custom startup scripts from entrypoint.d
if [ -d "$HOME/entrypoint.d" ]; then
    for script in "$HOME/entrypoint.d"/*.sh; do
        if [ -f "$script" ] && [ -x "$script" ]; then
            echo "Running startup script: $script"
            "$script"
        fi
    done
fi

echo "=== Starting code-server ==="

# Start code-server with dumb-init for proper signal handling
exec dumb-init /usr/bin/code-server "$@"
