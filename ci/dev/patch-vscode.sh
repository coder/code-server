#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  cd ./lib/vscode
  git apply ../../ci/dev/vscode.patch
}

main "$@"
