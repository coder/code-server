#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  # Check if the remote exists
  # if it doesn't, we add it
  if ! git config remote.vscode.url > /dev/null; then
    echo "Could not find 'vscode' as a remote"
    echo "Adding with: git remote add -f vscode https://github.com/microsoft/vscode.git &> /dev/null"
    echo "Supressing output with '&> /dev/null'"
    git remote add -f vscode https://github.com/microsoft/vscode.git &> /dev/null
  fi
}

main "$@"
