#!/usr/bin/env bash
set -euo pipefail

# Builds vscode into lib/vscode/out-vscode.

# MINIFY controls whether a minified version of vscode is built.
MINIFY=${MINIFY-true}

main() {
  cd "$(dirname "${0}")/../.."

  cd lib/vscode

  # Any platform works since we have our own packaging step (for now).
  yarn gulp "vscode-reh-web-linux-x64${MINIFY:+-min}"
}

main "$@"
