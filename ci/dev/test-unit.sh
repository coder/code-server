#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  source ./ci/lib.sh

  # TODO@jsjoeio - skip if already built
  # TODO@jsjoeio - move to integration test suite too
  echo "Building test plugin"
  pushd test/unit/node/test-plugin
  make -s out/index.js
  popd

  # Our code imports from `out` in order to work during development but if you
  # have only built for production you will have not have this directory.  In
  # that case symlink `out` to a production build directory.
  if [[ ! -e lib/vscode/out ]]; then
    pushd lib
    local out=(vscode-reh-web-*)
    if [[ -d "${out[0]}" ]]; then
      ln -s "../${out[0]}/out" ./vscode/out
    else
      echo "Could not find lib/vscode/out or lib/vscode-reh-web-*"
      echo "Code must be built before running unit tests"
      exit 1
    fi
    popd
  fi

  # We must keep jest in a sub-directory. See ../../test/package.json for more
  # information. We must also run it from the root otherwise coverage will not
  # include our source files.
  CS_DISABLE_PLUGINS=true ./test/node_modules/.bin/jest "$@" --testRegex "./test/unit/.*ts" --testPathIgnorePatterns "./test/unit/node/test-plugin"
}

main "$@"
