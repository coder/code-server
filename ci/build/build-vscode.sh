#!/usr/bin/env bash
set -euo pipefail

# Builds vscode into vendor/modules/code-oss-dev/out-vscode.

# MINIFY controls whether a minified version of vscode is built.
MINIFY=${MINIFY-true}

main() {
  cd "$(dirname "${0}")/../.."

  cd vendor/modules/code-oss-dev

  yarn gulp compile-build compile-extensions-build compile-extension-media
  yarn gulp optimize --gulpfile ./coder.js
  if [[ $MINIFY ]]; then
    yarn gulp minify --gulpfile ./coder.js
  fi
}

main "$@"
