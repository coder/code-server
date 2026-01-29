# ============================================================================
# Claude Code Server - Browser-based VS Code with AI Coding Assistants
# https://github.com/sphinxcode/claude-code-server
# ============================================================================

FROM codercom/code-server:4.108.0

USER root

# ============================================================================
# SYSTEM DEPENDENCIES
# Install gosu, Node.js 20, Python/uv, and essential tools
# Cache bust: 2026-01-29-v4
# ============================================================================

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        gosu \
        nodejs \
        python3 \
        python3-pip \
        git \
        curl \
        wget \
        unzip \
        jq \
        htop \
        vim \
        nano \
        ripgrep \
    && npm install -g npm@latest \
    && pip3 install --break-system-packages uv \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ============================================================================
# PERSISTENCE CONFIGURATION
# BACKWARD COMPATIBLE: Defaults to /home/coder for existing volumes
# ============================================================================

ENV HOME=/home/coder
ENV USER=coder

# XDG Base Directory Specification
ENV XDG_DATA_HOME=/home/coder/.local/share
ENV XDG_CONFIG_HOME=/home/coder/.config
ENV XDG_CACHE_HOME=/home/coder/.cache
ENV XDG_STATE_HOME=/home/coder/.local/state

# PATH: Volume paths FIRST (user installs), image paths LAST (fallbacks)
ENV PATH="/home/coder/.local/bin:/home/coder/.local/node/bin:/home/coder/.claude/local:/home/coder/node_modules/.bin:/usr/local/bin:/usr/bin:/usr/lib/code-server/lib/vscode/bin/remote-cli:${PATH}"

# Custom startup scripts directory
ENV ENTRYPOINTD=/home/coder/entrypoint.d

# ============================================================================
# USER SETUP
# The base image already has coder user with UID 1000
# ============================================================================

# Ensure coder user exists with correct UID/GID
RUN id -u coder &>/dev/null || useradd -m -s /bin/bash -u 1000 -g 1000 coder 2>/dev/null || true

# ============================================================================
# DIRECTORY SETUP
# ============================================================================

RUN mkdir -p \
    /home/coder/.local/share \
    /home/coder/.config \
    /home/coder/.cache \
    /home/coder/.local/state \
    /home/coder/.local/bin \
    /home/coder/.local/node \
    /home/coder/.claude \
    /home/coder/entrypoint.d \
    /home/coder/workspace \
    && chown -R 1000:1000 /home/coder

# Copy our custom entrypoint (replaces base image's entrypoint)
COPY railway-entrypoint.sh /usr/bin/railway-entrypoint.sh
RUN chmod +x /usr/bin/railway-entrypoint.sh

# ============================================================================
# FALLBACK CLAUDE CODE CLI INSTALLATION
# Installed to /usr/local/bin as fallback - volume version takes priority
# Claude Code is ALWAYS installed (cannot be disabled)
# ============================================================================

RUN curl -fsSL https://claude.ai/install.sh | bash \
    && if [ -f /root/.claude/local/claude ]; then \
         mv /root/.claude/local/claude /usr/local/bin/claude; \
         chmod +x /usr/local/bin/claude; \
       fi \
    && rm -rf /root/.claude

# ============================================================================
# RUNTIME
# Stay as root - entrypoint handles user switching based on RUN_AS_USER
# ============================================================================

WORKDIR /home/coder/workspace
EXPOSE 8080

# Use our entrypoint which calls code-server directly
ENTRYPOINT ["/usr/bin/railway-entrypoint.sh"]

