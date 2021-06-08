#!/usr/bin/env bash
set -euo pipefail

# Builds code-server into out and the frontend into dist.

# MINIFY controls whether parcel minifies dist.
MINIFY=${MINIFY-true}

main() {
  local opts=()
  [[ $MINIFY ]] && opts+=("-p" "tinyfy")
  cd "$(dirname "${0}")/../.."

  tsc

  # If out/node/entry.js does not already have the shebang,
  # we make sure to add it and make it executable.
  if ! grep -q -m1 "^#!/usr/bin/env node" out/node/entry.js; then
    sed -i.bak "1s;^;#!/usr/bin/env node\n;" out/node/entry.js && rm out/node/entry.js.bak
    chmod +x out/node/entry.js
  fi

  if ! [ -f ./lib/coder-cloud-agent ]; then
    echo "Downloading the cloud agent..."

    # for arch; we do not use OS from lib.sh and get our own.
    # lib.sh normalizes macos to darwin - but cloud-agent's binaries do not
    source ./ci/lib.sh
    OS="$(uname | tr '[:upper:]' '[:lower:]')"

    set +e
    curl -fsSL "https://github.com/cdr/cloud-agent/releases/latest/download/cloud-agent-$OS-$ARCH" -o ./lib/coder-cloud-agent
    chmod +x ./lib/coder-cloud-agent
    set -e
  fi

  yarn browserify "${opts[@]}" src/browser/register.ts -o out/browser/register.browserified.js
  yarn browserify "${opts[@]}" src/browser/pages/login.ts -o out/browser/pages/login.browserified.js
  yarn browserify "${opts[@]}" src/browser/pages/vscode.ts -o out/browser/pages/vscode.browserified.js
}

main "$@"
