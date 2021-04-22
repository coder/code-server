#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."
  cd test
  # We set these environment variables because they're used in the e2e tests
  # they don't have to be these values, but these are the defaults
  PASSWORD=e45432jklfdsab CODE_SERVER_ADDRESS=http://localhost:8080 yarn folio --config=config.ts --reporter=list "$@"
}

main "$@"
