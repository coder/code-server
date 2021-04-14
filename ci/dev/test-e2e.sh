#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."
  cd test
  PASSWORD=e45432jklfdsab CODE_SERVER_ADDRESS=http://localhost:8080 yarn folio --config=config.ts --reporter=list
}

main "$@"
