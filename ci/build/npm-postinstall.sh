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

  if ! vscode_yarn; then
    echo "You may not have the required dependencies to build the native modules."
    echo "Please see https://github.com/cdr/code-server/blob/master/doc/npm.md"
    exit 1
  fi
}

vscode_yarn() {
  cd lib/vscode
  yarn --production --frozen-lockfile
  cd extensions
  yarn --production --frozen-lockfile
}

main "$@"
