#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  yarn
  yarn vscode
  yarn build
  yarn build:vscode
  yarn release
}

main "$@"
