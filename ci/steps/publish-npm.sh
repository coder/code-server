#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc
  ./ci/container/exec.sh yarn publish --non-interactive release
}

main "$@"
