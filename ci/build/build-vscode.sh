#!/usr/bin/env bash
set -euo pipefail

# Builds vscode into vendor/modules/code-oss-dev/out-vscode.

# MINIFY controls whether a minified version of vscode is built.
MINIFY=${MINIFY-true}

main() {
  cd "$(dirname "${0}")/../.."

  cd vendor/modules/code-oss-dev

  if [[ $MINIFY ]]; then
    yarn compile-server-min
  else
    yarn compile-server
  fi
}

main "$@"
