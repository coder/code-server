#!/usr/bin/env sh
# code-server.sh -- Run code-server with the bundled Node binary.

cd "$(dirname "$0")" || exit 1

./node ./out/node/entry.js "$@"
