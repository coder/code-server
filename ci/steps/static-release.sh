#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  yarn release:static
  ./ci/build/test-static-release.sh
  ./ci/build/archive-static-release.sh

  if [[ $OSTYPE == linux* ]]; then
    yarn pkg
  fi
}

main "$@"
