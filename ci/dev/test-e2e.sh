#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."
  cd test
  # TODO@jsjoeio remove the test-match
  PASSWORD=e45432jklfdsab CODE_SERVER_ADDRESS=http://localhost:8080 yarn folio --config=config.ts --test-match login.test.ts --reporter=list
}

main "$@"
