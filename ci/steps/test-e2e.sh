#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  "./release-packages/code-server*-linux-amd64/bin/code-server" --home "$CODE_SERVER_ADDRESS"/healthz &
  yarn --frozen-lockfile
  yarn test:e2e
}

main "$@"
