#!/usr/bin/env sh
set -eu

if [ "${DOCKER_USER-}" ]; then
  echo "$DOCKER_USER ALL=(ALL) NOPASSWD:ALL" | sudo tee -a /etc/sudoers.d/nopasswd > /dev/null
  sudo usermod --login "$DOCKER_USER" \
    --move-home --home "/home/$DOCKER_USER" \
    coder
  sudo groupmod -n "$DOCKER_USER" coder

  sudo sed -i "/coder/d" /etc/sudoers.d/nopasswd
  sudo sed -i "s/coder/$DOCKER_USER/g" /etc/fixuid/config.yml
  export HOME="/home/$DOCKER_USER"
fi

# This isn't set by default.
export USER="$(whoami)"
dumb-init fixuid -q /usr/bin/code-server "$@"
