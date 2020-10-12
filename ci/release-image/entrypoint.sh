#!/bin/sh
set -eu

# This isn't set by default.
USER="$(whoami)"
export USER

if [ "${DOCKER_USER-}" ] && [ "$DOCKER_USER" != "$USER" ]; then
  echo "$DOCKER_USER ALL=(ALL) NOPASSWD:ALL" | sudo tee -a /etc/sudoers.d/nopasswd > /dev/null
  # Unfortunately we cannot change $HOME as we cannot move any bind mounts
  # nor can we bind mount $HOME into a new home as that requires a privileged container.
  sudo usermod --login "$DOCKER_USER" coder
  sudo groupmod -n "$DOCKER_USER" coder

  USER="$DOCKER_USER"

  sudo sed -i "/coder/d" /etc/sudoers.d/nopasswd
  sudo sed -i "s/coder/$DOCKER_USER/g" /etc/fixuid/config.yml
fi

dumb-init fixuid -q /usr/bin/code-server "$@"
