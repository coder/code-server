#!/usr/bin/env bash
set -euo pipefail

# This script requires code-server and vscode to be built with
# matching MINIFY.

# RELEASE_PATH is the destination directory for the release from the root.
# Defaults to release
RELEASE_PATH="${RELEASE_PATH-release}"

# STATIC controls whether node and node_modules are packaged into the release.
# Disabled by default.
STATIC="${STATIC-}"

# MINIFY controls whether minified vscode is bundled and whether
# any included node_modules are pruned for production.
MINIFY="${MINIFY-true}"

VSCODE_SRC_PATH="lib/vscode"

VSCODE_OUT_PATH="$RELEASE_PATH/lib/vscode"

main() {
  cd "$(dirname "${0}")/../.."
  source ./ci/lib.sh

  mkdir -p "$RELEASE_PATH"

  bundle_code_server
  bundle_vscode

  rsync README.md "$RELEASE_PATH"
  rsync LICENSE.txt "$RELEASE_PATH"
  rsync ./lib/vscode/ThirdPartyNotices.txt "$RELEASE_PATH"

  if [[ $STATIC ]]; then
    rsync "$RELEASE_PATH/" "$RELEASE_PATH-static"
    RELEASE_PATH+=-static
    VSCODE_OUT_PATH="$RELEASE_PATH/lib/vscode"

    bundle_node
  else
    rm -Rf "$VSCODE_OUT_PATH/extensions/node_modules"
  fi
}

rsync() {
  command rsync -a --del "$@"
}

bundle_code_server() {
  rsync out dist "$RELEASE_PATH"

  # For source maps and images.
  mkdir -p "$RELEASE_PATH/src/browser"
  rsync src/browser/media/ "$RELEASE_PATH/src/browser/media"
  mkdir -p "$RELEASE_PATH/src/browser/pages"
  rsync src/browser/pages/*.html "$RELEASE_PATH/src/browser/pages"

  rsync yarn.lock "$RELEASE_PATH"

  # Adds the commit to package.json
  jq --slurp '.[0] * .[1]' package.json <(
    cat << EOF
  {
    "commit": "$(git rev-parse HEAD)",
    "scripts": {
      "postinstall": "cd lib/vscode && yarn --production && cd extensions && yarn --production"
    }
  }
EOF
  ) > "$RELEASE_PATH/package.json"
}

bundle_vscode() {
  mkdir -p "$VSCODE_OUT_PATH"
  rsync "$VSCODE_SRC_PATH/out-vscode${MINIFY+-min}/" "$VSCODE_OUT_PATH/out"
  rsync "$VSCODE_SRC_PATH/.build/extensions/" "$VSCODE_OUT_PATH/extensions"
  rsync "$VSCODE_SRC_PATH/extensions/package.json" "$VSCODE_OUT_PATH/extensions"
  rsync "$VSCODE_SRC_PATH/extensions/yarn.lock" "$VSCODE_OUT_PATH/extensions"
  rsync "$VSCODE_SRC_PATH/extensions/postinstall.js" "$VSCODE_OUT_PATH/extensions"

  mkdir -p "$VSCODE_OUT_PATH/resources/linux"
  rsync "$VSCODE_SRC_PATH/resources/linux/code.png" "$VSCODE_OUT_PATH/resources/linux/code.png"

  rsync "$VSCODE_SRC_PATH/yarn.lock" "$VSCODE_OUT_PATH"

  # Adds the commit and date to product.json
  jq --slurp '.[0] * .[1]' "$VSCODE_SRC_PATH/product.json" <(
    cat << EOF
  {
    "commit": "$(git rev-parse HEAD)",
    "date": $(jq -n 'now | todate')
  }
EOF
  ) > "$VSCODE_OUT_PATH/product.json"

  # We remove the scripts field so that later on we can run
  # yarn to fetch node_modules if necessary without build scripts
  # being ran.
  # We cannot use --no-scripts because we still want dependant package scripts to run
  # for native modules to be rebuilt.
  jq 'del(.scripts)' < "$VSCODE_SRC_PATH/package.json" > "$VSCODE_OUT_PATH/package.json"
}

bundle_node() {
  # We cannot find the path to node from $PATH because yarn shims a script to ensure
  # we use the same version it's using so we instead run a script with yarn that
  # will print the path to node.
  local node_path
  node_path="$(yarn -s node <<< 'console.info(process.execPath)')"

  mkdir -p "$RELEASE_PATH/bin"
  rsync ./ci/build/code-server.sh "$RELEASE_PATH/bin/code-server"
  rsync "$node_path" "$RELEASE_PATH/lib/node"

  rsync node_modules "$RELEASE_PATH"
  rsync "$VSCODE_SRC_PATH/node_modules" "$VSCODE_OUT_PATH"

  if [[ $MINIFY ]]; then
    pushd "$RELEASE_PATH"
    yarn --production
    popd
  fi
}

main "$@"
