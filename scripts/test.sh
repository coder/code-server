#!/usr/bin/env sh
# test.sh -- Simple build test.

set -eu

main() {
  cd "$(dirname "$0")/.."

  # The main goal here is to ensure that the build fully completed and the
  # result looks usable.
  version=$(node ./build/out/node/entry.js --version --json)
  echo "Got '$version' for the version"
  case $version in
    "{ codeServer":*) exit 0 ;;
    *) exit 1 ;;
  esac
}

main "$@"
