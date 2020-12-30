#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "${0}")/../.."
  source ./ci/lib.sh

  git clean -Xffd

  pushd lib/vscode
  git clean -xffd
  popd
}

main "$@"
