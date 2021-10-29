#!/usr/bin/env bash
set -euo pipefail

# Builds vscode into vendor/modules/code-oss-dev/out-vscode.

# MINIFY controls whether a minified version of vscode is built.
MINIFY=${MINIFY-true}

main() {
  cd "$(dirname "${0}")/../.."

  cd vendor/modules/code-oss-dev

  # extensions-ci compiles extensions and includes their media.
  # compile-web compiles web extensions. TODO: Unsure if used.
  yarn gulp extensions-ci compile-web "vscode-reh-web${MINIFY:+-min}"
}

main "$@"
