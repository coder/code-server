#!/usr/bin/env bash
set -euo pipefail

help() {
  echo >&2 "  You can build with 'npm run watch' or you can build a release"
  echo >&2 "  For example: 'npm run build && npm run build:vscode && KEEP_MODULES=1 npm run release'"
  echo >&2 "  Then 'CODE_SERVER_TEST_ENTRY=./release npm run test:e2e'"
  echo >&2 "  You can manually run that release with 'node ./release'"
}

main() {
  cd "$(dirname "$0")/../.."

  source ./ci/lib.sh

  pushd test/e2e/extensions/test-extension
  echo "Building test extension"
  npm run build
  popd

  local dir="$PWD"
  if [[ ! ${CODE_SERVER_TEST_ENTRY-} ]]; then
    echo "Set CODE_SERVER_TEST_ENTRY to test another build of code-server"
  else
    pushd "$CODE_SERVER_TEST_ENTRY"
    dir="$PWD"
    popd
  fi

  echo "Testing build in '$dir'"

  # Simple sanity checks to see that we've built. There could still be things
  # wrong (native modules version issues, incomplete build, etc).
  if [[ ! -d $dir/out ]]; then
    echo >&2 "No code-server build detected"
    help
    exit 1
  fi

  if [[ ! -d $dir/lib/vscode/out ]]; then
    echo >&2 "No VS Code build detected"
    help
    exit 1
  fi

  cd test
  ./node_modules/.bin/playwright test "$@"
}

main "$@"
