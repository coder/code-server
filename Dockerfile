# ============================================================================
# VSCode Cloud IDE - Claude Code & Node.js Ready
# Browser-based VSCode with persistent extensions and Node.js
# https://github.com/sphinxcode/code-server
# ============================================================================

FROM codercom/code-server:latest

USER root

# Install FALLBACK Node.js and essential development tools
# Volume-installed versions take priority at runtime via PATH ordering
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        nodejs \
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
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ============================================================================
# PERSISTENCE CONFIGURATION
# Default paths - can be overridden via CODER_HOME environment variable
# ============================================================================

ENV HOME=/home/coder
ENV USER=coder

# XDG Base Directory Specification
ENV XDG_DATA_HOME=/home/coder/.local/share
ENV XDG_CONFIG_HOME=/home/coder/.config
ENV XDG_CACHE_HOME=/home/coder/.cache
ENV XDG_STATE_HOME=/home/coder/.local/state

# ============================================================================
# PATH PRIORITY ORDER (volume paths FIRST, image paths LAST)
# This ensures user-installed tools on the volume take precedence
# ============================================================================

ENV PATH="/home/coder/.local/node/bin:/home/coder/.claude/local:/home/coder/.local/bin:/home/coder/node_modules/.bin:/usr/local/bin:/usr/bin:/usr/lib/code-server/lib/vscode/bin/remote-cli:${PATH}"

# Custom startup scripts directory (on volume)
ENV ENTRYPOINTD=/home/coder/entrypoint.d

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

# Copy custom entrypoint
COPY railway-entrypoint.sh /usr/bin/railway-entrypoint.sh
RUN chmod +x /usr/bin/railway-entrypoint.sh

# ============================================================================
# FALLBACK CLAUDE CODE CLI INSTALLATION
# Installed to /usr/local/bin as fallback - volume version takes priority
# ============================================================================

RUN curl -fsSL https://claude.ai/install.sh | bash \
    && if [ -f /root/.claude/local/claude ]; then \
         mv /root/.claude/local/claude /usr/local/bin/claude; \
         chmod +x /usr/local/bin/claude; \
       fi \
    && rm -rf /root/.claude

# ============================================================================
# RUNTIME
# Note: We run as root for compatibility with existing volumes
# The entrypoint creates symlinks to ensure persistence
# ============================================================================

WORKDIR /home/coder/workspace
EXPOSE 8080

ENTRYPOINT ["/usr/bin/railway-entrypoint.sh"]
CMD ["--bind-addr", "0.0.0.0:8080", "/home/coder/workspace"]

