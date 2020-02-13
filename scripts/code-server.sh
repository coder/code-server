#!/usr/bin/env bash
# code-server.sh -- Run code-server with the bundled Node binary.

main() {
  cd "$(dirname "$0")" || exit 1
  ./node ./out/node/entry.js "$@"
}

main "$@"
