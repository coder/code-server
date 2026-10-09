#!/bin/sh
set -eu

# We do this first to ensure sudo works below when renaming the user.
# Otherwise the current container UID may not exist in the passwd database.
eval "$(fixuid -q)"

# Rename the `coder` user if a new name is specified by the `DOCKER_USER` environment variable
if [ "${DOCKER_USER-}" != "coder" ]; then
  USER="$DOCKER_USER"

  # If the named user is not already present in the system
  if [ -z "$(id -u "$DOCKER_USER" 2>/dev/null)" ]; then

    # Add a line adding the new user to sudoers without password prompting
    echo "$DOCKER_USER ALL=(ALL) NOPASSWD:ALL" | sudo tee -a /etc/sudoers.d/nopasswd > /dev/null

    # Rename the `coder` user and group
    # Unfortunately we cannot change $HOME as we cannot move any bind mounts
    # nor can we bind mount $HOME into a new home as that requires a privileged container.
    sudo usermod --login "$DOCKER_USER" coder
    sudo groupmod -n "$DOCKER_USER" coder

    # Delete the line granting sudo access for the former username (coder)
    sudo sed -i "/coder/d" /etc/sudoers.d/nopasswd
  fi
fi

# Allow users to have scripts run on container startup to prepare workspace.
# https://github.com/coder/code-server/issues/5177
if [ -d "${ENTRYPOINTD}" ]; then
  find "${ENTRYPOINTD}" -type f -executable -print -exec {} \;
fi

exec dumb-init /usr/bin/code-server "$@"
