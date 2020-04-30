#!/usr/bin/env bash
set -euo pipefail

# Builds code-server into out and the frontend into dist.

# MINIFY controls whether parcel minifies dist.
MINIFY=${MINIFY-true}

main() {
  cd "$(dirname "${0}")/../.."

  npx tsc --outDir out --tsBuildInfoFile .cache/out.tsbuildinfo
  # If out/node/entry.js does not already have the shebang,
  # we make sure to add it and make it executable.
  if ! grep -q -m1 "^#!/usr/bin/env node" out/node/entry.js; then
    sed -i.bak "1s;^;#!/usr/bin/env node\n;" out/node/entry.js && rm out/node/entry.js.bak
    chmod +x out/node/entry.js
  fi

  npx parcel build \
    --public-url "/static/$(git rev-parse HEAD)/dist" \
    --out-dir dist \
    $([[ $MINIFY ]] || echo --no-minify) \
    src/browser/pages/app.ts \
    src/browser/register.ts \
    src/browser/serviceWorker.ts
}

main "$@"
