#!/usr/bin/env bash
set -euo pipefail

# Builds code-server into out and the frontend into dist.

main() {
  cd "$(dirname "${0}")/../.."

  tsc

  # If out/node/entry.js does not already have the shebang,
  # we make sure to add it and make it executable.
  if ! grep -q -m1 "^#!/usr/bin/env node" out/node/entry.js; then
    sed -i.bak "1s;^;#!/usr/bin/env node\n;" out/node/entry.js && rm out/node/entry.js.bak
    chmod +x out/node/entry.js
  fi
}

main "$@"
