#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  yarn release:static
  ./ci/build/test-static-release.sh
  yarn package
}

main "$@"
