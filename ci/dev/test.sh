#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  mocha -r ts-node/register ./test/*.test.ts
}

main "$@"
