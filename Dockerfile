# Custom code-server image for Railway with persistent Node.js and extensions
FROM codercom/code-server:latest

USER root

# Install Node.js 20 LTS
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g npm@latest \
    && rm -rf /var/lib/apt/lists/*

# Set HOME to /home/coder (the volume mount point on Railway)
# This ensures all user data goes to the persistent volume
ENV HOME=/home/coder
ENV USER=coder

# Set XDG directories to use the persistent volume
ENV XDG_DATA_HOME=/home/coder/.local/share
ENV XDG_CONFIG_HOME=/home/coder/.config
ENV XDG_CACHE_HOME=/home/coder/.cache
ENV XDG_STATE_HOME=/home/coder/.local/state

# Ensure Node.js is in PATH and add code-server CLI
ENV PATH="/usr/bin:/usr/local/bin:/home/coder/.local/bin:/home/coder/.local/node/bin:/usr/lib/code-server/lib/vscode/bin/remote-cli:${PATH}"

# Set entrypoint.d to the persistent volume for custom startup scripts
ENV ENTRYPOINTD=/home/coder/entrypoint.d

# Create necessary directories
RUN mkdir -p /home/coder/.local/share \
    /home/coder/.config \
    /home/coder/.cache \
    /home/coder/.local/state \
    /home/coder/.local/bin \
    /home/coder/entrypoint.d \
    && chown -R 1000:1000 /home/coder

# Copy custom entrypoint
COPY railway-entrypoint.sh /usr/bin/railway-entrypoint.sh
RUN chmod +x /usr/bin/railway-entrypoint.sh

EXPOSE 8080

# Use our custom entrypoint that handles Railway's root user
ENTRYPOINT ["/usr/bin/railway-entrypoint.sh"]
CMD ["--bind-addr", "0.0.0.0:8080", "."]
