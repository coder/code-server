#!/bin/bash

# Try to set up the private (per user) User Data folder
set +e
mkdir -p $HOME/Workspace/Documents/$USERNAME/code-server
export XDG_DATA_HOME=$HOME/Workspace/Documents/$USERNAME
set -e

echo 'export PS1="$USERNAME:\w\$ "' >> $HOME/.bashrc

# Set the default project folder
DEFAULT_PROJECT_FOLDER="$HOME/Workspace/"

# Use the provided PROJECT_FOLDER or default to DEFAULT_PROJECT_FOLDER
STARTING_FOLDER="${PROJECT_FOLDER:-$DEFAULT_PROJECT_FOLDER}"

# Your script logic here
echo "Starting in folder: $STARTING_FOLDER"

/opt/code-server/bin/code-server \
    --disable-telemetry \
    --disable-update-check \
    --disable-workspace-trust \
    --locale=$LANG \
    --welcome-text="Welcome to your Golden Helix VSCode environment" \
    --ignore-last-opened \
    $STARTING_FOLDER