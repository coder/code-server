#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  yarn --frozen-lockfile

  yarn fmt
}

main "$@"
