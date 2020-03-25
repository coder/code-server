#!/usr/bin/env bash
# build-test.bash -- Make sure the build worked.
# This is to make sure we don't have Node version errors or any other
# compilation-related errors.

set -euo pipefail

function main() {
  cd "$(dirname "${0}")/.." || exit 1

  local output
  output=$(node ./build/out/node/entry.js --list-extensions 2>&1)
  if echo "$output" | grep 'was compiled against a different Node.js version'; then
    echo "$output"
    exit 1
  else
    echo "Build ran successfully"
  fi
}

main "$@"
