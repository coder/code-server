#!/usr/bin/env bash
set -euo pipefail

# Once both code-server and VS Code have been built, use this script to copy
# them into a single directory (./release), prepare the package.json and
# product.json, and add shrinkwraps.  This results in a generic NPM package that
# we published to NPM and also use to compile platform-specific packages.

# MINIFY controls whether minified VS Code is bundled. It must match the value
# used when VS Code was built.
MINIFY="${MINIFY-true}"

# node_modules are not copied by default.  Set KEEP_MODULES=1 to copy them.
KEEP_MODULES="${KEEP_MODULES-0}"

main() {
  cd "$(dirname "${0}")/../.."

  source ./ci/lib.sh

  VSCODE_SRC_PATH="lib/vscode"
  VSCODE_OUT_PATH="$RELEASE_PATH/lib/vscode"

  create_shrinkwraps

  mkdir -p "$RELEASE_PATH"

  bundle_code_server
  bundle_vscode

  rsync ./docs/README.md "$RELEASE_PATH"
  rsync LICENSE "$RELEASE_PATH"
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
  jq --slurp '(.[0] | del(.scripts,.jest,.devDependencies)) * .[1]' package.json <(
    cat << EOF
  {
    "commit": "$(git rev-parse HEAD)",
    "scripts": {
      "postinstall": "sh ./postinstall.sh"
    }
  }
EOF
  ) > "$RELEASE_PATH/package.json"
  mv npm-shrinkwrap.json "$RELEASE_PATH"

  rsync ci/build/npm-postinstall.sh "$RELEASE_PATH/postinstall.sh"

  if [ "$KEEP_MODULES" = 1 ]; then
    rsync node_modules/ "$RELEASE_PATH/node_modules"
  fi
}

bundle_vscode() {
  mkdir -p "$VSCODE_OUT_PATH"

  local rsync_opts=()
  if [[ ${DEBUG-} = 1 ]]; then
    rsync_opts+=(-vh)
  fi

  # Some extensions have a .gitignore which excludes their built source from the
  # npm package so exclude any .gitignore files.
  rsync_opts+=(--exclude .gitignore)

  # Exclude Node as we will add it ourselves for the standalone and will not
  # need it for the npm package.
  rsync_opts+=(--exclude /node)

  # Exclude Node modules.
  if [[ $KEEP_MODULES = 0 ]]; then
    rsync_opts+=(--exclude node_modules)
  fi

  rsync "${rsync_opts[@]}" ./lib/vscode-reh-web-*/ "$VSCODE_OUT_PATH"

  # Merge the package.json for the web/remote server so we can include
  # dependencies, since we want to ship this via NPM.
  jq --slurp '.[0] * .[1]' \
    "$VSCODE_SRC_PATH/remote/package.json" \
    "$VSCODE_OUT_PATH/package.json" > "$VSCODE_OUT_PATH/package.json.merged"
  mv "$VSCODE_OUT_PATH/package.json.merged" "$VSCODE_OUT_PATH/package.json"
  cp "$VSCODE_SRC_PATH/remote/npm-shrinkwrap.json" "$VSCODE_OUT_PATH/npm-shrinkwrap.json"

  # Include global extension dependencies as well.
  rsync "$VSCODE_SRC_PATH/extensions/package.json" "$VSCODE_OUT_PATH/extensions/package.json"
  cp "$VSCODE_SRC_PATH/extensions/npm-shrinkwrap.json" "$VSCODE_OUT_PATH/extensions/npm-shrinkwrap.json"
  rsync "$VSCODE_SRC_PATH/extensions/postinstall.mjs" "$VSCODE_OUT_PATH/extensions/postinstall.mjs"
}

create_shrinkwraps() {
  # package-lock.json files (used to ensure deterministic versions of
  # dependencies) are not packaged when publishing to the NPM registry.
  #
  # To ensure deterministic dependency versions (even when code-server is
  # installed with NPM), we create an npm-shrinkwrap.json file from the
  # currently installed node_modules. This ensures the versions used from
  # development (that the package-lock.json guarantees) are also the ones
  # installed by end-users.  These will include devDependencies, but those will
  # be ignored when installing globally (for code-server), and because we use
  # --omit=dev (for VS Code).

  # We first generate the shrinkwrap file for code-server itself - which is the
  # current directory.
  cp package-lock.json package-lock.json.temp
  npm shrinkwrap
  mv package-lock.json.temp package-lock.json

  # Then the shrinkwrap files for the bundled VS Code.
  pushd "$VSCODE_SRC_PATH/remote/"
  cp package-lock.json package-lock.json.temp
  npm shrinkwrap
  mv package-lock.json.temp package-lock.json
  popd

  pushd "$VSCODE_SRC_PATH/extensions/"
  cp package-lock.json package-lock.json.temp
  npm shrinkwrap
  mv package-lock.json.temp package-lock.json
  popd
}

main "$@"
