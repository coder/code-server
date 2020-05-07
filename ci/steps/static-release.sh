#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  yarn
  yarn vscode
  yarn build
  yarn build:vscode
  STATIC=1 yarn release
  ./ci/build/test-static-release.sh
  ./ci/build/archive-static-release.sh
}

main "$@"
