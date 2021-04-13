#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."
  source ./ci/lib.sh

  # This installs the dependencies needed for testing
  cd test
  yarn
  cd ..

  cd lib/vscode
  yarn ${CI+--frozen-lockfile}

  symlink_asar
}

main "$@"
