#!/usr/bin/env bash
set -euo pipefail

# This script requires vscode to be built with matching MINIFY.

# MINIFY controls whether minified vscode is bundled.
MINIFY="${MINIFY-true}"

main() {
  cd "$(dirname "${0}")/../.."
  source ./ci/lib.sh

  VSCODE_SRC_PATH="lib/vscode"
  VSCODE_OUT_PATH="$RELEASE_PATH/lib/vscode"

  mkdir -p "$RELEASE_PATH"

  bundle_code_server
  bundle_vscode

  rsync README.md "$RELEASE_PATH"
  rsync LICENSE.txt "$RELEASE_PATH"
  rsync ./lib/vscode/ThirdPartyNotices.txt "$RELEASE_PATH"
}

bundle_code_server() {
  rsync out dist "$RELEASE_PATH"

  # For source maps and images.
  mkdir -p "$RELEASE_PATH/src/browser"
  rsync src/browser/media/ "$RELEASE_PATH/src/browser/media"
  mkdir -p "$RELEASE_PATH/src/browser/pages"
  rsync src/browser/pages/*.html "$RELEASE_PATH/src/browser/pages"

  # Adds the commit to package.json
  jq --slurp '.[0] * .[1]' package.json <(
    cat << EOF
  {
    "commit": "$(git rev-parse HEAD)",
    "scripts": {
      "postinstall": "./postinstall.sh"
    }
  }
EOF
  ) > "$RELEASE_PATH/package.json"
  rsync yarn.lock "$RELEASE_PATH"
  rsync ci/build/npm-postinstall.sh "$RELEASE_PATH/postinstall.sh"
}

bundle_vscode() {
  mkdir -p "$VSCODE_OUT_PATH"
  rsync "$VSCODE_SRC_PATH/package.json" "$VSCODE_OUT_PATH"
  rsync "$VSCODE_SRC_PATH/yarn.lock" "$VSCODE_OUT_PATH"
  rsync "$VSCODE_SRC_PATH/node_modules" "$VSCODE_OUT_PATH"
  rsync "$VSCODE_SRC_PATH/out-vscode${MINIFY+-min}/" "$VSCODE_OUT_PATH/out"
  rsync "$VSCODE_SRC_PATH/.build/extensions/" "$VSCODE_OUT_PATH/extensions"

  mkdir -p "$VSCODE_OUT_PATH/resources/linux"
  rsync "$VSCODE_SRC_PATH/resources/linux/code.png" "$VSCODE_OUT_PATH/resources/linux/code.png"

  # Adds the commit and date to product.json
  jq --slurp '.[0] * .[1]' "$VSCODE_SRC_PATH/product.json" <(
    cat << EOF
  {
    "commit": "$(git rev-parse HEAD)",
    "date": $(jq -n 'now | todate')
  }
EOF
  ) > "$VSCODE_OUT_PATH/product.json"

  pushd "$VSCODE_OUT_PATH"
  yarn --production --frozen-lockfile --ignore-scripts
  popd

  # We clear any native module builds.
  local native_modules
  mapfile -t native_modules < <(find "$VSCODE_OUT_PATH/node_modules" -name "binding.gyp" -exec dirname {} \;)
  local nm
  for nm in "${native_modules[@]}"; do
    rm -R "$nm/build"
  done

  # We have to rename node_modules to node_modules.bundled to avoid them being ignored by yarn.
  local node_modules
  mapfile -t node_modules < <(find "$VSCODE_OUT_PATH" -depth -name "node_modules")
  local nm
  for nm in "${node_modules[@]}"; do
    rm -Rf "$nm.bundled"
    mv "$nm" "$nm.bundled"
  done
}

main "$@"
