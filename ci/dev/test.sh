#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."
  cd test/test-plugin
  make -s out/index.js
  # We must keep jest in a sub-directory. See ../../test/package.json for more
  # information. We must also run it from the root otherwise coverage will not
  # include our source files.
  cd "$OLDPWD"
  # We use the same environment variables set in ci.yml in the test job
  CS_DISABLE_PLUGINS=true PASSWORD=e45432jklfdsab CODE_SERVER_ADDRESS=http://localhost:8080 ./test/node_modules/.bin/jest "$@"
}

main "$@"
