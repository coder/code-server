#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."
  ./test/node_modules/.bin/jest "$@"
}

main "$@"
