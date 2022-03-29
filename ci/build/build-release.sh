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

  # To ensure deterministic dependency versions (even when code-server is installed with NPM), we seed
  # an npm-shrinkwrap file from our yarn lockfile and the current node-modules installed.
  synp --source-file yarn.lock
  npm shrinkwrap
  # HACK@edvincent: The shrinkwrap file will contain the devDependencies, which by default
  # are installed if present in a lockfile. To avoid every user having to specify --production
  # to skip them, we carefully remove them from the shrinkwrap file.
  json -f npm-shrinkwrap.json -I -e "Object.keys(this.dependencies).forEach(dependency => { if (this.dependencies[dependency].dev) { delete this.dependencies[dependency] } } )"
  mv npm-shrinkwrap.json "$RELEASE_PATH"

  rsync ci/build/npm-postinstall.sh "$RELEASE_PATH/postinstall.sh"

  if [ "$KEEP_MODULES" = 1 ]; then
    rsync node_modules/ "$RELEASE_PATH/node_modules"
    mkdir -p "$RELEASE_PATH/lib"
    rsync ./lib/coder-cloud-agent "$RELEASE_PATH/lib"
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

  # Add the commit, date, our name, links, and enable telemetry. This just makes
  # telemetry available; telemetry can still be disabled by flag or setting.
  jq --slurp '.[0] * .[1]' "$VSCODE_SRC_PATH/product.json" <(
    cat << EOF
  {
    "enableTelemetry": true,
    "commit": "$(cd "$VSCODE_SRC_PATH" && git rev-parse HEAD)",
    "quality": "stable",
    "date": $(jq -n 'now | todate'),
    "codeServerVersion": "$VERSION",
    "nameShort": "code-server",
    "nameLong": "code-server",
    "applicationName": "code-server",
    "dataFolderName": ".code-server",
    "win32MutexName": "codeserver",
    "licenseUrl": "https://github.com/coder/code-server/blob/main/LICENSE.txt",
    "win32DirName": "code-server",
    "win32NameVersion": "code-server",
    "win32AppUserModelId": "coder.code-server",
    "win32ShellNameShort": "c&ode-server",
    "darwinBundleIdentifier": "com.coder.code.server",
    "linuxIconName": "com.coder.code.server",
    "reportIssueUrl": "https://github.com/coder/code-server/issues/new",
    "documentationUrl": "https://go.microsoft.com/fwlink/?LinkID=533484#vscode",
    "keyboardShortcutsUrlMac": "https://go.microsoft.com/fwlink/?linkid=832143",
    "keyboardShortcutsUrlLinux": "https://go.microsoft.com/fwlink/?linkid=832144",
    "keyboardShortcutsUrlWin": "https://go.microsoft.com/fwlink/?linkid=832145",
    "introductoryVideosUrl": "https://go.microsoft.com/fwlink/?linkid=832146",
    "tipsAndTricksUrl": "https://go.microsoft.com/fwlink/?linkid=852118",
    "newsletterSignupUrl": "https://www.research.net/r/vsc-newsletter",
    "linkProtectionTrustedDomains": [
      "https://open-vsx.org"
    ]
  }
EOF
  ) > "$VSCODE_OUT_PATH/product.json"

  # Use the package.json for the web/remote server.  It does not have the right
  # version though so pull that from the main package.json.
  jq --slurp '.[0] * {version: .[1].version}' \
    "$VSCODE_SRC_PATH/remote/package.json" \
    "$VSCODE_SRC_PATH/package.json" > "$VSCODE_OUT_PATH/package.json"

  rsync "$VSCODE_SRC_PATH/remote/yarn.lock" "$VSCODE_OUT_PATH/yarn.lock"

  # Include global extension dependencies as well.
  rsync "$VSCODE_SRC_PATH/extensions/package.json" "$VSCODE_OUT_PATH/extensions/package.json"
  rsync "$VSCODE_SRC_PATH/extensions/yarn.lock" "$VSCODE_OUT_PATH/extensions/yarn.lock"
  rsync "$VSCODE_SRC_PATH/extensions/postinstall.js" "$VSCODE_OUT_PATH/extensions/postinstall.js"

  pushd "$VSCODE_OUT_PATH"
  symlink_asar
  popd
}

main "$@"
