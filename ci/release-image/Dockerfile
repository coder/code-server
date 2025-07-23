# syntax=docker/dockerfile:experimental
ARG BASE=debian:12

# ==============================================================================
# Builder Stage
# This stage builds code-server from source and creates a .deb package.
# ==============================================================================
FROM node:20-bookworm as builder

# TARGETARCH is automatically set by Docker to the architecture of the build machine (e.g., amd64, arm64)
ARG TARGETARCH

# Install build dependencies.
# nfpm is used for creating .deb packages.
# We download the correct version for the target architecture.
RUN apt-get update && apt-get install -y git curl rsync jq \
 && NFPM_ARCH=${TARGETARCH} && \
    if [ "${TARGETARCH}" = "amd64" ]; then NFPM_ARCH="x86_64"; fi && \
    curl -sL "https://github.com/goreleaser/nfpm/releases/download/v2.35.3/nfpm_2.35.3_Linux_${NFPM_ARCH}.tar.gz" | tar -xz -C /usr/local/bin nfpm \
 && chmod +x /usr/local/bin/nfpm

WORKDIR /app

# Copy the entire project source. We need the .git directory for versioning.
COPY . .

# Initialize git submodules.
# Running as root in the container, so we need to mark the directory as safe.
RUN git config --global --add safe.directory /app && git submodule update --init --recursive

# Install all dependencies.
RUN npm install

RUN cd lib/vscode && npm install

# Build and package code-server.
# All build scripts will now run in a Linux environment, producing the correct artifacts.
ENV VERSION=0.0.1
# ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build:vscode
RUN npm run build
RUN npm run release:standalone
RUN npm run package
# RUN ./ci/build/build-release.sh
# RUN ./ci/build/build-packages.sh


# ==============================================================================
# Packages Stage
# This stage simply holds the .deb file for the final image.
# ==============================================================================
FROM scratch AS packages

# Copy the .deb package from the builder stage.
COPY --from=builder /app/release-packages/code-server*${TARGETARCH}*.deb /tmp/


# ==============================================================================
# Final Stage
# This is the original Dockerfile, mostly unmodified.
# ==============================================================================
FROM $BASE

RUN apt-get update \
  && apt-get install -y \
    curl \
    dumb-init \
    git \
    git-lfs \
    htop \
    locales \
    lsb-release \
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

# https://wiki.debian.org/Locale#Manually
RUN sed -i "s/# en_US.UTF-8/en_US.UTF-8/" /etc/locale.gen \
  && locale-gen
ENV LANG=en_US.UTF-8

RUN if grep -q 1000 /etc/passwd; then \
    userdel -r "$(id -un 1000)"; \
  fi \
  && adduser --gecos '' --disabled-password coder \
  && echo "coder ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/nopasswd

RUN ARCH="$(dpkg --print-architecture)" \
  && curl -fsSL "https://github.com/boxboat/fixuid/releases/download/v0.6.0/fixuid-0.6.0-linux-$ARCH.tar.gz" | tar -C /usr/local/bin -xzf - \
  && chown root:root /usr/local/bin/fixuid \
  && chmod 4755 /usr/local/bin/fixuid \
  && mkdir -p /etc/fixuid \
  && printf "user: coder\ngroup: coder\n" > /etc/fixuid/config.yml

COPY ci/release-image/entrypoint.sh /usr/bin/entrypoint.sh
# The glob pattern here is simplified since we now know the exact architecture.
RUN --mount=from=packages,src=/tmp,dst=/tmp/packages dpkg -i /tmp/packages/code-server*.deb

# Allow users to have scripts run on container startup to prepare workspace.
# https://github.com/coder/code-server/issues/5177
ENV ENTRYPOINTD=${HOME}/entrypoint.d

EXPOSE 8080
# This way, if someone sets $DOCKER_USER, docker-exec will still work as
# the uid will remain the same. note: only relevant if -u isn't passed to
# docker-run.
USER 1000
ENV USER=coder
WORKDIR /home/coder
ENTRYPOINT ["/usr/bin/entrypoint.sh", "--bind-addr", "0.0.0.0:8080", "."]