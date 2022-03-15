#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  source ./ci/lib.sh

  echo "Building test plugin"
  pushd test/unit/node/test-plugin
  make -s out/index.js
  popd

  # Our code imports from `out` in order to work during development but if you
  # have only built for production you will have not have this directory.  In
  # that case symlink `out` to a production build directory.
  local vscode="lib/vscode"
  local link="$vscode/out"
  local target="out-build"
  if [[ ! -e $link ]] && [[ -d $vscode/$target ]]; then
    ln -s "$target" "$link"
  fi

  # We must keep jest in a sub-directory. See ../../test/package.json for more
  # information. We must also run it from the root otherwise coverage will not
  # include our source files.
  CS_DISABLE_PLUGINS=true ./test/node_modules/.bin/jest "$@"
}

main "$@"
