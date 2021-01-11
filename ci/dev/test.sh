#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  cd test/test-plugin
  make -s out/index.js
  cd "$OLDPWD"
  yarn jest "$@"
}

main "$@"
