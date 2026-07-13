FROM codercom/code-server:latest

USER root

# Install opencode CLI globally via npm (supports all architectures)
RUN npm install -g opencode-ai@latest

USER coder
