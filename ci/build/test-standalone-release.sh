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
  # We use grep as ms-python.python may have dependency extensions that change.
  if ! echo "$installed_extensions" | grep -q "ms-python.python"; then
    echo "Unexpected output from listing extensions:"
    echo "$installed_extensions"
    exit 1
  fi

  echo "Standalone release works correctly."
}

main "$@"
