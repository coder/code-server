#!/usr/bin/env bash
set -euo pipefail

# Once both code-server and VS Code have been built, use this script to copy
# them into a single directory (./release), prepare the package.json and
# product.json, and add shrinkwraps.  This results in a generic NPM package that
# we can publish to NPM.

# MINIFY controls whether minified VS Code is bundled. It must match the value
# used when VS Code was built.
MINIFY="${MINIFY-true}"

# node_modules are not copied by default.  Set KEEP_MODULES=1 to copy them.
# Note these modules will be for the platform that built them, making the result
# no longer generic (it can still be published though as the modules will be
# ignored when pushing).
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

  if [ "$KEEP_MODULES" = 1 ]; then
    # Copy the code-server launcher.
    mkdir -p "$RELEASE_PATH/bin"
    rsync ./ci/build/code-server.sh "$RELEASE_PATH/bin/code-server"
    chmod 755 "$RELEASE_PATH/bin/code-server"

    # Delete the extra bin scripts.
    rm "$RELEASE_PATH/lib/vscode/bin/remote-cli/code-darwin.sh"
    rm "$RELEASE_PATH/lib/vscode/bin/remote-cli/code-linux.sh"
    rm "$RELEASE_PATH/lib/vscode/bin/helpers/browser-darwin.sh"
    rm "$RELEASE_PATH/lib/vscode/bin/helpers/browser-linux.sh"
    if [ "$OS" != windows ] ; then
      rm "$RELEASE_PATH/lib/vscode/bin/remote-cli/code.cmd"
      rm "$RELEASE_PATH/lib/vscode/bin/helpers/browser.cmd"
    fi
  fi
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

  # Adds the commit to package.json
  jq --slurp '(.[0] | del(.scripts,.jest,.devDependencies)) * .[1]' package.json <(
    cat << EOF
  {
    "version": "$(jq -r .codeServerVersion "./lib/vscode-reh-web-$VSCODE_TARGET/product.json")",
    "commit": "$(git rev-parse HEAD)",
    "scripts": {
      "postinstall": "sh ./postinstall.sh"
    }
  }
EOF
  ) > "$RELEASE_PATH/package.json"
  mv npm-shrinkwrap.json "$RELEASE_PATH"

  if [ "$KEEP_MODULES" = 1 ]; then
    local rsync_opts=(-a)
    if [[ ${DEBUG-} = 1 ]]; then
      rsync_opts+=(-vh)
    fi
    # If we build from source, exclude the prebuilds.
    if [[ ${npm_config_build_from_source-} = true ]]; then
      rsync_opts+=(--exclude /argon2/prebuilds)
    fi
    rsync "${rsync_opts[@]}" node_modules/ "$RELEASE_PATH/node_modules"
    # Remove dev dependencies.
    pushd "$RELEASE_PATH"
    npm prune --production
    popd
  fi

  rsync ci/build/npm-postinstall.sh "$RELEASE_PATH/postinstall.sh"
}

bundle_vscode() {
  mkdir -p "$VSCODE_OUT_PATH"

  local rsync_opts=(-a)
  if [[ ${DEBUG-} = 1 ]]; then
    rsync_opts+=(-vh)
  fi

  # Some extensions have a .gitignore which excludes their built source from the
  # npm package so exclude any .gitignore files.
  rsync_opts+=(--exclude .gitignore)

  # Exclude Node since we want to place it in a directory above.
  rsync_opts+=(--exclude /node)

  # Exclude Node modules.  Note that these will already only include production
  # dependencies, so if we do keep them there is no need to do any
  # post-processing to remove dev dependencies.
  if [[ $KEEP_MODULES = 0 ]]; then
    rsync_opts+=(--exclude node_modules)
  fi

  rsync "${rsync_opts[@]}" "./lib/vscode-reh-web-$VSCODE_TARGET/" "$VSCODE_OUT_PATH"

  # Copy the Node binary.
  if [[ $KEEP_MODULES = 1 ]]; then
    cp "./lib/vscode-reh-web-$VSCODE_TARGET/node" "$RELEASE_PATH/lib"
  fi

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
