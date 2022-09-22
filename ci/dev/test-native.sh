#!/usr/bin/env bash
set -euo pipefail

help() {
  echo >&2 "  You can build the standalone release with 'yarn release:standalone'"
  echo >&2 "  Or you can pass in a custom path."
  echo >&2 "  CODE_SERVER_PATH='/var/tmp/coder/code-server/bin/code-server' yarn test:integration"
}

# Make sure a code-server release works. You can pass in the path otherwise it
# will look for release-standalone in the current directory.
#
# This is to make sure we don't have Node version errors or any other
# compilation-related errors.
main() {
  cd "$(dirname "$0")/../.."

  source ./ci/lib.sh

  local path="$RELEASE_PATH-standalone/bin/code-server"
  if [[ ! ${CODE_SERVER_PATH-} ]]; then
    echo "Set CODE_SERVER_PATH to test another build of code-server"
  else
    path="$CODE_SERVER_PATH"
  fi

  echo "Running tests with code-server binary: '$path'"

  if [[ ! -f $path ]]; then
    echo >&2 "No code-server build detected"
    echo >&2 "Looked in $path"
    help
    exit 1
  fi

  CODE_SERVER_PATH="$path" ./test/node_modules/.bin/jest "$@" --coverage=false --testRegex "./test/integration/help.test.ts"
}

main "$@"
