# ============================================================================
# Claude Code Server - Browser-based VS Code with AI Coding Assistants
# https://github.com/sphinxcode/claude-code-server
# ============================================================================

FROM codercom/code-server:4.108.0

USER root

# ============================================================================
# SYSTEM DEPENDENCIES
# Install gosu, Node.js 20, Python/uv, and essential tools
# Cache bust: 2026-01-29-v5
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
# Default to /home/clauder for new deployments
# ============================================================================

ENV HOME=/home/clauder
ENV USER=clauder

# XDG Base Directory Specification
ENV XDG_DATA_HOME=/home/clauder/.local/share
ENV XDG_CONFIG_HOME=/home/clauder/.config
ENV XDG_CACHE_HOME=/home/clauder/.cache
ENV XDG_STATE_HOME=/home/clauder/.local/state

# PATH: Volume paths FIRST (user installs), image paths LAST (fallbacks)
ENV PATH="/home/clauder/.local/bin:/home/clauder/.local/node/bin:/home/clauder/.claude/local:/home/clauder/node_modules/.bin:/usr/local/bin:/usr/bin:/usr/lib/code-server/lib/vscode/bin/remote-cli:${PATH}"

# Custom startup scripts directory
ENV ENTRYPOINTD=/home/clauder/entrypoint.d

# ============================================================================
# USER SETUP
# Create clauder user (UID 1000 to match base image's coder user)
# ============================================================================

RUN groupadd -g 1000 clauder 2>/dev/null || true \
    && useradd -m -s /bin/bash -u 1000 -g 1000 clauder 2>/dev/null || true \
    && usermod -l clauder coder 2>/dev/null || true \
    && groupmod -n clauder coder 2>/dev/null || true

# ============================================================================
# DIRECTORY SETUP
# ============================================================================

RUN mkdir -p \
    /home/clauder/.local/share \
    /home/clauder/.config \
    /home/clauder/.cache \
    /home/clauder/.local/state \
    /home/clauder/.local/bin \
    /home/clauder/.local/node \
    /home/clauder/.claude \
    /home/clauder/entrypoint.d \
    /home/clauder/workspace \
    && chown -R 1000:1000 /home/clauder

# Copy our custom entrypoint (replaces base image's entrypoint)
COPY railway-entrypoint.sh /usr/bin/railway-entrypoint.sh
RUN chmod +x /usr/bin/railway-entrypoint.sh

# ============================================================================
# FALLBACK CLAUDE CODE CLI INSTALLATION
# Installed to /usr/local/bin as fallback - volume version takes priority
# Claude installer puts binary in ~/.local/bin/claude
# ============================================================================

RUN curl -fsSL https://claude.ai/install.sh | bash \
    && if [ -f /root/.local/bin/claude ]; then \
         cp /root/.local/bin/claude /usr/local/bin/claude; \
         chmod +x /usr/local/bin/claude; \
         echo "Claude CLI installed to /usr/local/bin/claude"; \
       else \
         echo "WARNING: Claude CLI not found at expected path"; \
         ls -la /root/.local/bin/ 2>/dev/null || echo "~/.local/bin does not exist"; \
         ls -la /root/.claude/ 2>/dev/null || echo "~/.claude does not exist"; \
       fi

# ============================================================================
# RUNTIME
# Stay as root - entrypoint handles user switching based on RUN_AS_USER
# ============================================================================

WORKDIR /home/clauder/workspace
EXPOSE 8080

# Use our entrypoint which calls code-server directly
ENTRYPOINT ["/usr/bin/railway-entrypoint.sh"]


