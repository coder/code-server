#!/usr/bin/env bash
set -euo pipefail

# Makes sure the release works.
# This is to make sure we don't have Node version errors or any other
# compilation-related errors.
main() {
  cd "$(dirname "${0}")/../.."

  local output
  output=$(./release-static/bin/code-server --list-extensions 2>&1)
  if echo "$output" | grep 'was compiled against a different Node.js version'; then
    echo "$output"
    exit 1
  fi

  echo "Build ran successfully"
}

main "$@"
