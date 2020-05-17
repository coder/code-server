#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "${0}")/../.."
  source ./ci/lib.sh

  rsync "$RELEASE_PATH/" "$RELEASE_PATH-static"
  RELEASE_PATH+=-static

  # We cannot find the path to node from $PATH because yarn shims a script to ensure
  # we use the same version it's using so we instead run a script with yarn that
  # will print the path to node.
  local node_path
  node_path="$(yarn -s node <<< 'console.info(process.execPath)')"

  mkdir -p "$RELEASE_PATH/bin"
  rsync ./ci/build/code-server.sh "$RELEASE_PATH/bin/code-server"
  rsync "$node_path" "$RELEASE_PATH/lib/node"

  cd "$RELEASE_PATH"
  yarn --production --frozen-lockfile
}

main "$@"
