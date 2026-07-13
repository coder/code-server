FROM codercom/code-server:latest

USER root

# Create directories for persistent volumes and set ownership
RUN mkdir -p /home/coder/.local/share/code-server/extensions \
             /home/coder/.config \
             /home/coder/.local/share/code-server/logs \
             /home/coder/.local/share/code-server/User && \
    chown -R coder:coder /home/coder/.local /home/coder/.config

# Install Node.js and npm (code-server bundles its own Node.js, but we need a global npm for opencode)
RUN apt-get update && apt-get install -y --no-install-recommends \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Install opencode CLI globally
RUN npm install -g opencode-ai@latest

USER coder
