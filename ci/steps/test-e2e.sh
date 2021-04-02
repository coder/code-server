#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  "./release-packages/code-server*-linux-amd64/bin/code-server" &
  yarn --frozen-lockfile
  yarn test:e2e
}

main "$@"
