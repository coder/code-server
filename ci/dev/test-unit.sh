#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."
  cd test/unit/node/test-plugin
  make -s out/index.js
  # We must keep jest in a sub-directory. See ../../test/package.json for more
  # information. We must also run it from the root otherwise coverage will not
  # include our source files.
  cd "$OLDPWD"
  CS_DISABLE_PLUGINS=true ./test/node_modules/.bin/jest "$@"
}

main "$@"
