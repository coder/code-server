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
  if [[ $OS == "linux" ]]; then
    bundle_dynamic_lib libstdc++
    bundle_dynamic_lib libgcc_s
  elif [[ $OS == "macos" ]]; then
    bundle_dynamic_lib libicui18n
    bundle_dynamic_lib libicuuc
    bundle_dynamic_lib libicudata
  fi

  ln -s "./bin/code-server" "$RELEASE_PATH/code-server"
  ln -s "./lib/node" "$RELEASE_PATH/node"

  cd "$RELEASE_PATH"
  yarn --production --frozen-lockfile
}

bundle_dynamic_lib() {
  lib_name="$1"

  if [[ $OS == "linux" ]]; then
    lib_path="$(ldd "$RELEASE_PATH/lib/node" | grep "$lib_name" | awk '{print $3 }')"
  elif [[ $OS == "macos" ]]; then
    lib_path="$(otool -L "$RELEASE_PATH/lib/node" | grep "$lib_name" | awk '{print $1 }')"
  fi

  cp "$lib_path" "$RELEASE_PATH/lib"
}

main "$@"
