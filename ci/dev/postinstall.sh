#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."
  source ./ci/lib.sh

  cd lib/vscode
  yarn ${CI+--frozen-lockfile}

  symlink_asar
}

main "$@"
