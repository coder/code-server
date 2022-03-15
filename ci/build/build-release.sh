#!/usr/bin/env bash
set -euo pipefail

# This script requires vscode to be built with matching MINIFY.

# MINIFY controls whether minified vscode is bundled.
MINIFY="${MINIFY-true}"

# KEEP_MODULES controls whether the script cleans all node_modules requiring a yarn install
# to run first.
KEEP_MODULES="${KEEP_MODULES-0}"

main() {
  cd "$(dirname "${0}")/../.."

  source ./ci/lib.sh

  VSCODE_SRC_PATH="lib/vscode"
  VSCODE_OUT_PATH="$RELEASE_PATH/lib/vscode"

  mkdir -p "$RELEASE_PATH"

  bundle_code_server
  bundle_vscode

  rsync ./docs/README.md "$RELEASE_PATH"
  rsync LICENSE.txt "$RELEASE_PATH"
  rsync ./lib/vscode/ThirdPartyNotices.txt "$RELEASE_PATH"
}

bundle_code_server() {
  rsync out "$RELEASE_PATH"

  # For source maps and images.
  mkdir -p "$RELEASE_PATH/src/browser"
  rsync src/browser/media/ "$RELEASE_PATH/src/browser/media"
  mkdir -p "$RELEASE_PATH/src/browser/pages"
  rsync src/browser/pages/*.html "$RELEASE_PATH/src/browser/pages"
  rsync src/browser/pages/*.css "$RELEASE_PATH/src/browser/pages"
  rsync src/browser/robots.txt "$RELEASE_PATH/src/browser"

  # Add typings for plugins
  mkdir -p "$RELEASE_PATH/typings"
  rsync typings/pluginapi.d.ts "$RELEASE_PATH/typings"

  # Adds the commit to package.json
  jq --slurp '.[0] * .[1]' package.json <(
    cat << EOF
  {
    "commit": "$(git rev-parse HEAD)",
    "scripts": {
      "postinstall": "sh ./postinstall.sh"
    }
  }
EOF
  ) > "$RELEASE_PATH/package.json"
  rsync yarn.lock "$RELEASE_PATH"
  rsync ci/build/npm-postinstall.sh "$RELEASE_PATH/postinstall.sh"

  if [ "$KEEP_MODULES" = 1 ]; then
    rsync node_modules/ "$RELEASE_PATH/node_modules"
    mkdir -p "$RELEASE_PATH/lib"
    rsync ./lib/coder-cloud-agent "$RELEASE_PATH/lib"
  fi
}

bundle_vscode() {
  mkdir -p "$VSCODE_OUT_PATH"
  rsync "$VSCODE_SRC_PATH/yarn.lock" "$VSCODE_OUT_PATH"
  rsync "$VSCODE_SRC_PATH/out-vscode-reh-web${MINIFY:+-min}/" "$VSCODE_OUT_PATH/out"

  rsync "$VSCODE_SRC_PATH/.build/extensions/" "$VSCODE_OUT_PATH/extensions"
  if [ "$KEEP_MODULES" = 0 ]; then
    rm -Rf "$VSCODE_OUT_PATH/extensions/node_modules"
  else
    rsync "$VSCODE_SRC_PATH/node_modules/" "$VSCODE_OUT_PATH/node_modules"
  fi
  rsync "$VSCODE_SRC_PATH/extensions/package.json" "$VSCODE_OUT_PATH/extensions"
  rsync "$VSCODE_SRC_PATH/extensions/yarn.lock" "$VSCODE_OUT_PATH/extensions"
  rsync "$VSCODE_SRC_PATH/extensions/postinstall.js" "$VSCODE_OUT_PATH/extensions"

  mkdir -p "$VSCODE_OUT_PATH/resources/"
  rsync "$VSCODE_SRC_PATH/resources/" "$VSCODE_OUT_PATH/resources/"

  # TODO: We should look into using VS Code's packaging task (see
  # gulpfile.reh.js).  For now copy this directory into the right spot (for some
  # reason VS Code uses a different path in production).
  mkdir -p "$VSCODE_OUT_PATH/bin/helpers"
  rsync "$VSCODE_SRC_PATH/resources/server/bin/helpers/" "$VSCODE_OUT_PATH/bin/helpers"
  chmod +x "$VSCODE_OUT_PATH/bin/helpers/browser.sh"

  # Add the commit and date and enable telemetry. This just makes telemetry
  # available; telemetry can still be disabled by flag or setting.
  jq --slurp '.[0] * .[1]' "$VSCODE_SRC_PATH/product.json" <(
    cat << EOF
  {
    "enableTelemetry": true,
    "commit": "$(cd "$VSCODE_SRC_PATH" && git rev-parse HEAD)",
    "quality": "stable",
    "date": $(jq -n 'now | todate'),
    "codeServerVersion": "$VERSION"
  }
EOF
  ) > "$VSCODE_OUT_PATH/product.json"

  # We remove the scripts field so that later on we can run
  # yarn to fetch node_modules if necessary without build scripts running.
  # We cannot use --no-scripts because we still want dependent package scripts to run.
  jq 'del(.scripts)' < "$VSCODE_SRC_PATH/package.json" > "$VSCODE_OUT_PATH/package.json"

  pushd "$VSCODE_OUT_PATH"
  symlink_asar
  popd
}

main "$@"
