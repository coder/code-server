#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  source ./ci/lib.sh

  # We must keep jest in a sub-directory. See ../../test/package.json for more
  # information. We must also run it from the root otherwise coverage will not
  # include our source files.
  ./test/node_modules/.bin/jest "$@" --testRegex "./test/unit/.*ts"
}

main "$@"
