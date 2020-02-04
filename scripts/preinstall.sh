#!/usr/bin/env sh
# preinstall.sh -- Prepare VS Code.

set -eu

main() {
  cd "$(dirname "${0}")/.."

# Ensure submodules are cloned and up to date.
  git submodule update --init

  # Try patching but don't worry too much if it fails. It's possible VS Code has
  # already been patched.
  yarn patch:apply || echo "Unable to patch; assuming already patched"

  # Install VS Code dependencies.
  cd ./lib/vscode
  yarn
}

main "$@"
