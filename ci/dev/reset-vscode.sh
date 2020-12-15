#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  cd ./lib/vscode
  git add -A
  git reset --hard
}

main "$@"
