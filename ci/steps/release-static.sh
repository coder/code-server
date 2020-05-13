#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  # https://github.com/actions/upload-artifact/issues/38
  chmod +x $(grep -rl '^#!/.\+' release)

  yarn release:static
  yarn test:static-release
  yarn package
}

main "$@"
