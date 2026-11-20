#!/usr/bin/env bash
set -euo pipefail

if [[ ${RUNNER_DEBUG-} = 1 ]]; then
  set -x
fi

# Once both code-server and VS Code have been built, use this script to copy
# them into a single directory (./release) and prepare the package.json and
# product.json.  This results in a generic package with only built code and no
# dependencies that we can publish to NPM and GitHub.

# MINIFY controls whether minified VS Code is bundled. It must match the value
# used when VS Code was built.
MINIFY="${MINIFY-true}"

# Set KEEP_MODULES=1 to copy dependencies, delete anything not specific to the
# platform (like the remote-cli scripts for other platforms), and include a
# launcher script plus a Node binary.  Note these modules will be for the
# platform that built them, making the result no longer generic.
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
  rsync LICENSE "$RELEASE_PATH"
  rsync ./lib/vscode/ThirdPartyNotices.txt "$RELEASE_PATH"

  if [ "$KEEP_MODULES" = 1 ]; then
    # Copy the code-server launcher.
    mkdir -p "$RELEASE_PATH/bin"
    rsync ./ci/build/code-server.sh "$RELEASE_PATH/bin/code-server"
    chmod 755 "$RELEASE_PATH/bin/code-server"

    # Windows cannot run the shell launcher, so it gets one of its own.
    if [ "$OS" = windows ]; then
      rsync ./ci/build/code-server.cmd "$RELEASE_PATH/bin/code-server.cmd"
    fi

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

  cp package.json "$RELEASE_PATH/package.json"
  cp pnpm-lock.yaml "$RELEASE_PATH/pnpm-lock.yaml"
  cp pnpm-workspace.yaml "$RELEASE_PATH/pnpm-workspace.yaml"

  if [ "$KEEP_MODULES" = 1 ]; then
    local rsync_opts=(-a)
    if [[ ${RUNNER_DEBUG-} = 1 ]]; then
      rsync_opts+=(-vh)
    fi
    # If we build from source, exclude the prebuilds.
    if [[ ${npm_config_build_from_source-} = true ]]; then
      rsync_opts+=(--exclude /argon2/prebuilds)
    fi
    rsync "${rsync_opts[@]}" node_modules/ "$RELEASE_PATH/node_modules"
    # Remove dev dependencies.  pnpm's prune must be told to ignore scripts or
    # it will try to run the post-install.
    pushd "$RELEASE_PATH"
    pnpm prune --production --ignore-scripts
    popd
  fi

  # - Add the commit and version.
  # - Strip unnecessary properties.  This needs to happen after the prune, since
  #   pnpm appears to have odd behavior with devDependencies missing (for
  #   example it was not removing the Typescript dev dependency).
  # - Add a post-install for use as an npm or generic package to install VS
  #   Code's modules.
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

  rsync ci/build/npm-postinstall.sh "$RELEASE_PATH/postinstall.sh"
}

bundle_vscode() {
  mkdir -p "$VSCODE_OUT_PATH"

  local rsync_opts=(-a)
  if [[ ${RUNNER_DEBUG-} = 1 ]]; then
    rsync_opts+=(-vh)
  fi

  # Some extensions have a .gitignore which excludes their built source from the
  # npm package so exclude any .gitignore files.
  rsync_opts+=(--exclude .gitignore)

  # Exclude Node since we want to place it in a directory above.
  rsync_opts+=(--exclude /node)
  rsync_opts+=(--exclude /node.exe)

  # Exclude Node modules.  Note that these will already only include production
  # dependencies, so if we do keep them there is no need to do any
  # post-processing to remove dev dependencies.
  if [[ $KEEP_MODULES = 0 ]]; then
    rsync_opts+=(--exclude node_modules)
  fi

  rsync "${rsync_opts[@]}" "./lib/vscode-reh-web-$VSCODE_TARGET/" "$VSCODE_OUT_PATH"

  # Copy the Node binary.
  if [[ $KEEP_MODULES = 1 ]]; then
    if [ "$OS" = windows ]; then
      cp "./lib/vscode-reh-web-$VSCODE_TARGET/node.exe" "$RELEASE_PATH/lib"
    else
      cp "./lib/vscode-reh-web-$VSCODE_TARGET/node" "$RELEASE_PATH/lib"
    fi
  fi

  # - Include the dependencies so unsupported platforms can use this package
  #   without having to build code-server (they only have to install
  #   dependencies) by downloading from either from NPM or from GitHub.
  # - Override the name to prevent vulnerability scanners from misidentifying
  #   this package as VS Code (see #7071).
  jq --slurp '.[1].dependencies = .[0].dependencies | .[1] | .name = "code-oss"' \
    "$VSCODE_SRC_PATH/remote/package.json" \
    "$VSCODE_OUT_PATH/package.json" > "$VSCODE_OUT_PATH/package.json.merged"
  mv "$VSCODE_OUT_PATH/package.json.merged" "$VSCODE_OUT_PATH/package.json"
  cp "$VSCODE_SRC_PATH/remote/pnpm-lock.yaml" "$VSCODE_OUT_PATH/pnpm-lock.yaml"
  cp "$VSCODE_SRC_PATH/remote/pnpm-workspace.yaml" "$VSCODE_OUT_PATH/pnpm-workspace.yaml"

  # Include global extension dependencies as well.
  jq 'del(.devDependencies)' "$VSCODE_SRC_PATH/extensions/package.json" > "$VSCODE_OUT_PATH/extensions/package.json"
  rsync "$VSCODE_SRC_PATH/extensions/pnpm-lock.yaml" "$VSCODE_OUT_PATH/extensions/pnpm-lock.yaml"
  rsync "$VSCODE_SRC_PATH/extensions/pnpm-workspace.yaml" "$VSCODE_OUT_PATH/extensions/pnpm-workspace.yaml"
}

main "$@"
