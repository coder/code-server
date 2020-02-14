#!/usr/bin/env bash
set -euo pipefail

# 1. Ensures VS Code is cloned.
# 2. Patches it.
# 3. Installs it.
main() {
  cd "$(dirname "$0")/.."

  git submodule update --init

  # If the patch fails to apply, then it's likely already applied
  yarn vscode:patch &>/dev/null || true

  # Install VS Code dependencies.
  (cd lib/vscode && yarn)
}

main "$@"
