#!/usr/bin/env bash
set -euo pipefail

# This is due to an upstream issue with RHEL7/CentOS 7 comptability with node-argon2
# See: https://github.com/cdr/code-server/pull/3422#pullrequestreview-677765057
export npm_config_build_from_source=true

main() {
  cd "$(dirname "${0}")/../.."

  source ./ci/lib.sh

  rsync "$RELEASE_PATH/" "$RELEASE_PATH-standalone"
  RELEASE_PATH+=-standalone

  # We cannot find the path to node from $PATH because yarn shims a script to ensure
  # we use the same version it's using so we instead run a script with yarn that
  # will print the path to node.
  local node_path
  node_path="$(yarn -s node <<< 'console.info(process.execPath)')"

  mkdir -p "$RELEASE_PATH/bin"
  mkdir -p "$RELEASE_PATH/lib"
  rsync ./ci/build/code-server.sh "$RELEASE_PATH/bin/code-server"
  rsync "$node_path" "$RELEASE_PATH/lib/node"

  ln -s "./bin/code-server" "$RELEASE_PATH/code-server"
  ln -s "./lib/node" "$RELEASE_PATH/node"

  pushd "$RELEASE_PATH"
  npm install --unsafe-perm --omit=dev
  popd
}

main "$@"
