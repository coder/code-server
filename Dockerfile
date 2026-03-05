FROM debian:12

RUN apt-get update && apt-get install -y \
    curl \
    dumb-init \
    git \
    git-lfs \
    htop \
    locales \
    man-db \
    nano \
    openssh-client \
    procps \
    sudo \
    vim-tiny \
    wget \
    zsh \
  && git lfs install \
  && rm -rf /var/lib/apt/lists/*

# Set locale
RUN sed -i "s/# en_US.UTF-8/en_US.UTF-8/" /etc/locale.gen && locale-gen
ENV LANG=en_US.UTF-8

# Install code-server
RUN curl -fsSL https://code-server.dev/install.sh | sh

# Create coder user
RUN adduser --gecos '' --disabled-password coder \
  && echo "coder ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/nopasswd

USER coder
WORKDIR /home/coder

# Railway sets PORT; default to 8080
ENV PORT=8080

# Use shell form so $PORT is expanded at runtime
ENTRYPOINT ["/bin/sh", "-c", "exec dumb-init code-server --bind-addr 0.0.0.0:${PORT}"]
