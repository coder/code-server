# Build stage for Python
FROM debian:bullseye-slim AS python-builder

# Install some Python build-related stuff
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
    build-essential \
    wget \
    libgdbm-dev \
    libncursesw5-dev \
    libffi-dev \
    liblzma-dev \
    libreadline-dev \
    libsqlite3-dev \
    libbz2-dev \
    libssl-dev \
    libxml2-dev \
    libxmlsec1-dev \
    tk-dev \
    xz-utils \
    zlib1g-dev && \
    rm -rf /var/lib/apt/lists/*

# Build Python 3.13.8 from source
RUN cd /tmp && \
    wget https://www.python.org/ftp/python/3.13.8/Python-3.13.8.tgz && \
    tar xzf Python-3.13.8.tgz && \
    cd Python-3.13.8 && \
    ./configure --enable-optimizations --prefix=/opt/python && \
    make -j$(nproc) && \
    make altinstall && \
    cd /tmp && \
    rm -rf Python-3.13.8*


# Final stage
FROM codercom/code-server:4.19.1-bullseye

# Install _runtime_ dependencies:
RUN apt-get update && \
    apt-get -y upgrade && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
    git \
    dumb-init \
    htop \
    locales \
    lsb-release \
    libnss-ldap \
    ldap-utils \
    man-db \
    nano \
    openssh-client \
    procps \
    zsh \
    curl \
    less \
    vim \
    wget \
    # Python _runtime_ dependencies
    libbz2-1.0 \
    libffi7 \
    liblzma5 \
    libncursesw6 \
    libreadline8 \
    libsqlite3-0 \
    libssl1.1 \
    libxml2 \
    libxmlsec1 \
    tk \
    zlib1g && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy Python from python-builder stage:
COPY --from=python-builder /opt/python /opt/python

# Create Python symlinks:
RUN ln -sf /opt/python/bin/python3.13 /usr/local/bin/python3 && \
    ln -sf /opt/python/bin/python3.13 /usr/local/bin/python && \
    ln -sf /opt/python/bin/pip3.13 /usr/local/bin/pip3 && \
    ln -sf /opt/python/bin/pip3.13 /usr/local/bin/pip

# Install Python packages
COPY ./requirements.txt /tmp/requirements.txt
RUN pip3 install --no-cache-dir --upgrade pip && \
    pip3 install --no-cache-dir -r /tmp/requirements.txt && \
    rm /tmp/requirements.txt

# Install latest stable Node.js (24.9.0)
RUN curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y nodejs=24.9.0-1nodesource1 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install golang 1.24.9
RUN ARCH=$(dpkg --print-architecture) && \
    wget https://go.dev/dl/go1.24.9.linux-${ARCH}.tar.gz && \
    tar -C /usr/local -xzf go1.24.9.linux-${ARCH}.tar.gz && \
    rm go1.24.9.linux-${ARCH}.tar.gz

# Set up environment and PATH
ENV LANG=en_US.UTF-8
ENV GOPATH=/go
ENV GOROOT=/usr/local/go
ENV PATH="/opt/python/bin:$GOPATH/bin:$GOROOT/bin:$PATH"

#-----------------------------------------------------------------------------
# Install code-server extensions
# Note: This installs extensions in /root/.local/share/code-server/extensions.
#       $HOME is not avaible at build time, so tar up ext directory and put it
#       in /opt/code-server/helx-extensions.tgz. An init script will copy them
#       to the user's $HOME once it's been set up by user-mutator.
#-----------------------------------------------------------------------------
RUN /usr/bin/code-server --install-extension ms-python.python \
                         --install-extension ms-python.debugpy \
                         --install-extension njqdev.vscode-python-typehint \
                         --install-extension magicstack.magicpython \
                         --install-extension njpwerner.autodocstring \
                         --install-extension EricSia.pythonsnippets3 \
                         --install-extension golang.go \
                         --install-extension christian-kohler.npm-intellisense \
                         --install-extension christian-kohler.path-intellisense \
                         --install-extension esbenp.prettier-vscode && \
    # tar up and move extension archive so init script can later propagate it to user's $HOME
    /bin/tar -czvf helx-extensions.tgz -C /root/.local/share/code-server extensions && \
    mkdir -p /opt/code-server && \
    mv /home/coder/helx-extensions.tgz /opt/code-server/helx-default-extensions.tgz && \
    chmod 644 /opt/code-server/helx-default-extensions.tgz && \
    # Remove extensions files and config.yaml under /root
    rm -f /root/.config/code-server/config.yaml && \
    rm -rf /root/.local/share/code-server/extensions/*

COPY --chmod=0755 ci/release-image/entrypoint.sh /usr/bin/entrypoint.sh
COPY --chmod=0644 ci/release-image/config.yaml /opt/code-server/config.yaml
COPY --chmod=0644 ci/release-image/settings.json /opt/code-server/settings.json

# Expose code-server port
EXPOSE 8080

ENTRYPOINT ["dumb-init", "--"]
CMD ["/usr/bin/entrypoint.sh", "--bind-addr", "0.0.0.0:8080", "--auth", "none", "--cert", "false", "."]
