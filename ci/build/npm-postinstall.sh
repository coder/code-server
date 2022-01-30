#!/usr/bin/env sh
set -eu

# Copied from arch() in ci/lib.sh.
detect_arch() {
  case "$(uname -m)" in
    aarch64)
      echo arm64
      ;;
    x86_64 | amd64)
      echo amd64
      ;;
    *)
      # This will cause the download to fail, but is intentional
      uname -m
      ;;
  esac
}

ARCH="${NPM_CONFIG_ARCH:-$(detect_arch)}"

main() {
  # Grabs the major version of node from $npm_config_user_agent which looks like
  # yarn/1.21.1 npm/? node/v14.2.0 darwin x64
  major_node_version=$(echo "$npm_config_user_agent" | sed -n 's/.*node\/v\([^.]*\).*/\1/p')

  if [ -n "${FORCE_NODE_VERSION:-}" ]; then
    echo "WARNING: Overriding required Node.js version to v$FORCE_NODE_VERSION"
    echo "This could lead to broken functionality, and is unsupported."
    echo "USE AT YOUR OWN RISK!"
  fi

  if [ "$major_node_version" -ne "${FORCE_NODE_VERSION:-14}" ]; then
    echo "ERROR: code-server currently requires node v14."
    if [ -n "$FORCE_NODE_VERSION" ]; then
      echo "However, you have overrided the version check to use v$FORCE_NODE_VERSION."
    fi
    echo "We have detected that you are on node v$major_node_version"
    echo "You can override this version check by setting \$FORCE_NODE_VERSION,"
    echo "but configurations that do not use the same node version are unsupported."
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

  mkdir -p ./lib

  if curl -fsSL "https://github.com/coder/cloud-agent/releases/latest/download/cloud-agent-$OS-$ARCH" -o ./lib/coder-cloud-agent; then
    chmod +x ./lib/coder-cloud-agent
  else
    echo "Failed to download cloud agent; --link will not work"
  fi

  if ! vscode_yarn; then
    echo "You may not have the required dependencies to build the native modules."
    echo "Please see https://github.com/coder/code-server/blob/master/docs/npm.md"
    exit 1
  fi

  if [ -n "${FORCE_NODE_VERSION:-}" ]; then
    echo "WARNING: The required Node.js version was overriden to v$FORCE_NODE_VERSION"
    echo "This could lead to broken functionality, and is unsupported."
    echo "USE AT YOUR OWN RISK!"
  fi
}

# This is a copy of symlink_asar in ../lib.sh. Look there for details.
symlink_asar() {
  rm -rf node_modules.asar
  if [ "${WINDIR-}" ]; then
    mklink /J node_modules.asar node_modules
  else
    ln -s node_modules node_modules.asar
  fi
}

vscode_yarn() {
  echo 'Installing vendor dependencies...'
  cd vendor/modules/code-oss-dev
  yarn --production --frozen-lockfile

  symlink_asar

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
