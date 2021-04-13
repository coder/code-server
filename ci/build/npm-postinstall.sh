#!/usr/bin/env sh
set -eu

main() {
  # Grabs the major version of node from $npm_config_user_agent which looks like
  # yarn/1.21.1 npm/? node/v14.2.0 darwin x64
  major_node_version=$(echo "$npm_config_user_agent" | sed -n 's/.*node\/v\([^.]*\).*/\1/p')
  if [ "$major_node_version" -lt 12 ]; then
    echo "code-server currently requires at least node v12"
    echo "We have detected that you are on node v$major_node_version"
    echo "See https://github.com/cdr/code-server/issues/1633"
    exit 1
  fi

  case "${npm_config_user_agent-}" in npm*)
    # We are running under npm.
    if [ "${npm_config_unsafe_perm-}" != "true" ]; then
      echo "Please pass --unsafe-perm to npm to install code-server"
      echo "Otherwise the postinstall script does not have permissions to run"
      echo "See https://docs.npmjs.com/misc/config#unsafe-perm"
      echo "See https://stackoverflow.com/questions/49084929/npm-sudo-global-installation-unsafe-perm"
      exit 1
    fi
    ;;
  esac

  OS="$(uname | tr '[:upper:]' '[:lower:]')"
  if curl -fsSL "https://storage.googleapis.com/coder-cloud-releases/agent/latest/$OS/cloud-agent" -o ./lib/coder-cloud-agent; then
    chmod +x ./lib/coder-cloud-agent
  else
    echo "Failed to download cloud agent; --link will not work"
  fi

  if ! vscode_yarn; then
    echo "You may not have the required dependencies to build the native modules."
    echo "Please see https://github.com/cdr/code-server/blob/master/docs/npm.md"
    exit 1
  fi
}

vscode_yarn() {
  cd lib/vscode
  yarn --production --frozen-lockfile

  # This is a copy of symlink_asar in ../lib.sh. Look there for details.
  if [ ! -e node_modules.asar ]; then
    if [ "${WINDIR-}" ]; then
      mklink /J node_modules.asar node_modules
    else
      ln -s node_modules node_modules.asar
    fi
  fi

  cd extensions
  yarn --production --frozen-lockfile
  for ext in */; do
    ext="${ext%/}"
    echo "extensions/$ext: installing dependencies"
    cd "$ext"
    yarn --production --frozen-lockfile
    cd "$OLDPWD"
  done
}

main "$@"
