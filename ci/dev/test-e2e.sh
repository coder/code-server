#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  source ./ci/lib.sh

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
    echo >&2 "You can build it with 'yarn build' or 'yarn watch'"
    exit 1
  fi

  if [[ ! -d $dir/vendor/modules/code-oss-dev/out ]]; then
    echo >&2 "No VS Code build detected"
    echo >&2 "You can build it with 'yarn build:vscode' or 'yarn watch'"
    exit 1
  fi

  cd test
  yarn playwright test "$@"
}

main "$@"
