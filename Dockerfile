# Base image
FROM ubuntu:22.04

# Install Python, pip, git, curl, and wget
RUN apt-get update && \
    apt-get install -y python3.10 python3-pip git curl wget sudo && \
    apt-get clean

# Create a non-root user
RUN useradd -m -s /bin/bash codeuser

# Create project directory
RUN mkdir -p /home/codeuser/project

# Create .pb directory and siteconfig.yaml file
RUN mkdir -p /home/codeuser/.pb && \
    touch /home/codeuser/.pb/siteconfig.yaml

# Install RudderStack Profiles CLI (assuming pip install)
RUN pip3 install profiles-rudderstack

# Install code-server (VSCode in the browser)
RUN curl -fsSL https://code-server.dev/install.sh | sh

# Switch to codeuser for extension installation and MCP setup
USER codeuser
WORKDIR /home/codeuser

# Install extension as codeuser
RUN code-server --install-extension saoudrizwan.claude-dev

# Clone profiles-mcp as codeuser
RUN git clone https://github.com/rudderlabs/profiles-mcp

# Set up the Python script
# RUN echo '#!/usr/bin/env python3' > /home/codeuser/profiles-mcp/scripts/update_mcp_config.py 
# RUN echo 'RUDDERSTACK_PAT=xxxx' > /home/codeuser/profiles-mcp/.env

# Run setup as codeuser
# RUN cd /home/codeuser/profiles-mcp && bash setup.sh

# Create MCP settings directory and file
# RUN mkdir -p /home/codeuser/.local/share/code-server/User/globalStorage/saoudrizwan.claude-dev/settings/
# RUN echo '{"mcpServers":{ "Profiles": { "command": "/home/codeuser/profiles-mcp/scripts/start.sh", "args": [] }}}' > /home/codeuser/.local/share/code-server/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json 

# Set proper ownership and permissions
USER root
RUN chown -R codeuser:codeuser /home/codeuser
RUN chmod 755 /home/codeuser/project
RUN chmod 644 /home/codeuser/.pb/siteconfig.yaml
RUN chmod 755 /home/codeuser/.pb

# Switch back to codeuser
USER codeuser
WORKDIR /home/codeuser/project

EXPOSE 8080

# Start code-server when container runs, opening the project directory
CMD ["code-server", "--bind-addr", "0.0.0.0:8080", "/home/codeuser/project"]