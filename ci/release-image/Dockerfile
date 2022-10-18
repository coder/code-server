# syntax=docker/dockerfile:experimental

FROM scratch AS packages
COPY release-packages/code-server*.deb /tmp/
COPY release-packages/flyte-sandbox*.vsix /tmp/

FROM debian:11

RUN apt-get update \
  && apt-get install -y \
  curl \
  dumb-init \
  zsh \
  htop \
  locales \
  man \
  nano \
  git \
  git-lfs \
  python3-pip \
  procps \
  openssh-client \
  sudo \
  vim.tiny \
  lsb-release \
  && git lfs install \
  && rm -rf /var/lib/apt/lists/*

# flytekit
RUN pip install git+https://github.com/flyteorg/flytekit.git@b1dbab951e4d5562facf913e77b6d64c0da527e4#egg=flytekit

# flytectl
RUN curl -sL https://ctl.flyte.org/install | bash

# https://wiki.debian.org/Locale#Manually
RUN sed -i "s/# en_US.UTF-8/en_US.UTF-8/" /etc/locale.gen \
  && locale-gen
ENV LANG=en_US.UTF-8

RUN adduser --gecos '' --disabled-password coder && \
  echo "coder ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/nopasswd

RUN ARCH="$(dpkg --print-architecture)" && \
  curl -fsSL "https://github.com/boxboat/fixuid/releases/download/v0.5/fixuid-0.5-linux-$ARCH.tar.gz" | tar -C /usr/local/bin -xzf - && \
  chown root:root /usr/local/bin/fixuid && \
  chmod 4755 /usr/local/bin/fixuid && \
  mkdir -p /etc/fixuid && \
  printf "user: coder\ngroup: coder\n" > /etc/fixuid/config.yml

COPY ci/release-image/entrypoint.sh /usr/bin/entrypoint.sh
RUN --mount=from=packages,src=/tmp,dst=/tmp/packages dpkg -i /tmp/packages/code-server*$(dpkg --print-architecture).deb

# Allow users to have scripts run on container startup to prepare workspace.
# https://github.com/coder/code-server/issues/5177
ENV ENTRYPOINTD=${HOME}/entrypoint.d

EXPOSE 8080
# This way, if someone sets $DOCKER_USER, docker-exec will still work as
# the uid will remain the same. note: only relevant if -u isn't passed to
# docker-run.
USER 1000
ENV USER=coder

# vscode extensions
RUN code-server --install-extension ms-python.python
RUN --mount=from=packages,src=/tmp,dst=/tmp/packages ls /tmp/packages/flyte-sandbox*.vsix | head -1 | xargs -I {} sh -c "code-server --install-extension {}"

RUN mkdir -p /home/coder/flyte
WORKDIR /home/coder/flyte
RUN git clone https://github.com/flyteorg/flytesnacks

ENTRYPOINT ["/usr/bin/entrypoint.sh", "--bind-addr", "0.0.0.0:8080", "."]
