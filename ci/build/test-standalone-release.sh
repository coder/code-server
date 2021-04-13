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

  # Note: using a basic theme extension because it doesn't update often and is more reliable for testing
  ./release-standalone/bin/code-server --extensions-dir "$EXTENSIONS_DIR" --install-extension wesbos.theme-cobalt2
  local installed_extensions
  installed_extensions="$(./release-standalone/bin/code-server --extensions-dir "$EXTENSIONS_DIR" --list-extensions 2>&1)"
  # We use grep as wesbos.theme-cobalt2 may have dependency extensions that change.
  if ! echo "$installed_extensions" | grep -q "wesbos.theme-cobalt2"; then
    echo "Unexpected output from listing extensions:"
    echo "$installed_extensions"
    exit 1
  fi

  echo "Standalone release works correctly."
}

main "$@"
