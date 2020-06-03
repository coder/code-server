#!/usr/bin/env bash
set -euo pipefail

# Makes sure the release works.
# This is to make sure we don't have Node version errors or any other
# compilation-related errors.
main() {
  cd "$(dirname "${0}")/../.."

  local EXTENSIONS_DIR
  EXTENSIONS_DIR="$(mktemp -d)"

  echo "Testing standalone release."

  ./release-standalone/bin/code-server --extensions-dir "$EXTENSIONS_DIR" --install-extension ms-python.python
  local installed_extensions
  installed_extensions="$(./release-standalone/bin/code-server --extensions-dir "$EXTENSIONS_DIR" --list-extensions 2>&1)"
  if [[ "$installed_extensions" != "info  Using config file ~/.config/code-server/config.yaml
ms-python.python" ]]; then
    echo "Unexpected output from listing extensions:"
    echo "$installed_extensions"
    exit 1
  fi

  echo "Standalone release works correctly."
}

main "$@"
