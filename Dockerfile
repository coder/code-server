# Use a base image of Ubuntu
FROM ubuntu:latest

# Update the system and install curl
RUN apt-get update && apt-get install -y curl

# Create a non-root user and a directory for VS Code Server
RUN useradd -m vscode
RUN mkdir /home/vscode/workplace
RUN chown -R vscode:vscode /home/vscode/workplace

# Download and install VS Code Server
RUN curl -fsSL https://code-server.dev/install.sh | sh

# Install NVM
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash

# Install Caddy
RUN apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
RUN curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
RUN echo "deb [signed-by=/usr/share/keyrings/caddy-stable-archive-keyring.gpg] https://dl.cloudsmith.io/public/caddy/stable/deb/debian any-version main" | tee /etc/apt/sources.list.d/caddy-stable.list
RUN apt-get update
RUN apt-get install caddy

# Add Caddy configuration file
RUN echo "example.com {\n  reverse_proxy 127.0.0.1:8080\n}" > /etc/caddy/Caddyfile

# Switch to non-root user
USER vscode

# Set CODE_SERVER_USER_DATA_DIR environment variable
ENV CODE_SERVER_USER_DATA_DIR=/home/vscode/workplace

# Expose port 8080
EXPOSE 8080

# Start VS Code Server and Caddy when the container is started
CMD /bin/bash -c "code-server --bind-addr 0.0.0.0:8080 & caddy run"