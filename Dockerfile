FROM codercom/code-server:latest

USER root

# Install Node.js and npm (code-server bundles its own Node.js, not globally available)
RUN apt-get update && apt-get install -y --no-install-recommends \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Install opencode CLI globally
RUN npm install -g opencode-ai@latest

USER coder
