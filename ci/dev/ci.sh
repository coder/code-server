#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  yarn fmt
  yarn lint
  yarn _audit
  yarn test:unit
}

main "$@"
