FROM codercom/code-server:latest

USER root

# Install opencode CLI globally
RUN curl -fsSL https://opencode.ai/install | sh

# Ensure opencode is in PATH for the coder user
ENV PATH="${PATH}:/home/coder/.opencode/bin"

USER coder
