#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  yarn release:static
  yarn test:static-release
  yarn package
}

main "$@"
