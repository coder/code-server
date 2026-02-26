#!/bin/bash
set -eu

HELX_DEFAULTS_DIR="/opt/code-server"
HELX_DEFAULT_SETTINGS="$HELX_DEFAULTS_DIR/settings.json"
HELX_DEFAULT_CONFIG="$HELX_DEFAULTS_DIR/config.yaml"
HELX_EXTENSION_ARCHIVE="$HELX_DEFAULTS_DIR/helx-default-extensions.tgz"

USER_SCRIPT_DIR="$HOME/entrypoint.d"
USER_CONFIG_DIR="$HOME/.config/code-server"
USER_SETTINGS_DIR="$HOME/.local/share/code-server/User"
USER_EXTENSION_DIR="$HOME/.local/share/code-server/extensions"

USER_CONFIG_FILE="$USER_CONFIG_DIR/config.yaml"
USER_SETTINGS_FILE="$USER_SETTINGS_DIR/settings.json"

USER_SCRIPTS_ENABLED=1

INIT_SCRIPT="$(basename "$0")"

umask 0022

log() { echo "[$INIT_SCRIPT]: $*"; }

log "Running."

# Allow users to run scripts to set up workspace on container startup.
# https://github.com/coder/code-server/issues/5177
if [ ! -d "$USER_SCRIPT_DIR" ]; then
    log "Creating script directory for user scripts."
    mkdir -p "$USER_SCRIPT_DIR"
else
    if [ $USER_SCRIPTS_ENABLED -eq 1 ]; then
        log "Checking $USER_SCRIPT_DIR for user scripts."
        for script in "$USER_SCRIPT_DIR"/*.sh; do
            if [ -x "$script" ]; then
                log "Running script: $script"
                bash "$script"
                STATUS=$?
                if [ $STATUS -ne 0 ]; then
                    log "Error: Script $script failed with exit code $STATUS."
                fi
            else
                log "$script is not executable; skipping."
            fi
        done
    else
        log "Running user scripts not enabled."
    fi
fi

# Copy in config.yaml file if not present; vs-code creates one with
#     auth: password set by default!
if [ ! -f "$USER_CONFIG_FILE" ]; then
    log "Copying default config.yaml file to $USER_CONFIG_FILE."
    mkdir -p "$USER_CONFIG_DIR"
    chmod 755 "$USER_CONFIG_DIR"
    cp "$HELX_DEFAULT_CONFIG" "$USER_CONFIG_FILE"
    chmod 644 "$USER_CONFIG_FILE"
else
    log "$USER_CONFIG_FILE file exists."
fi

# Copy in settings.json if not present
if [ ! -f $USER_SETTINGS_FILE ]; then
    log "Copying default settings.json file to $USER_SETTINGS_FILE"
    mkdir -p $USER_SETTINGS_DIR
    chmod 755 "$USER_SETTINGS_DIR"
    cp $HELX_DEFAULT_SETTINGS $USER_SETTINGS_FILE
    chmod 644 "$USER_SETTINGS_FILE"
else
    log "$USER_SETTINGS_FILE file exists."
fi

# Only add default extensions the first time. If there's an existing extensions directory, bail
if [ ! -d "$USER_EXTENSION_DIR" ]; then
    log "Creating extensions directory to add default extensions."
    mkdir -p "$USER_EXTENSION_DIR"
    chmod 755 "$USER_EXTENSION_DIR"
    tar -xzf $HELX_EXTENSION_ARCHIVE -C $USER_EXTENSION_DIR --skip-old-files --strip-components=1
    find "$USER_EXTENSION_DIR" -type d -exec chmod 755 {} \;
    find "$USER_EXTENSION_DIR" -type f -exec chmod 644 {} \;
    log "Finished installing default extensions."
else
    log "Found existing extensions directory, not installing default extensions."
fi

# Set up a default workspace so it doesn't run in /home/coder
log "Setting default workspace."
export DEFAULT_WORKSPACE=$HOME

# Expand args passed in--but replace last one with $HOME:
log "Passed in args: [ $@ ]"
cmd_args="${@:1:$#-1}"
cmd_args+=" ${HOME}"
log "Updated args  : [ ${cmd_args} ]"

entrypoint="dumb-init -- /usr/bin/code-server "
log "Entrypoint    : [ ${entrypoint}]"

startup_cmd="$entrypoint"
startup_cmd+="$cmd_args"
log "Starting      : [ ${startup_cmd} ]"

exec $startup_cmd
