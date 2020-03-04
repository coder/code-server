#!/usr/bin/env sh
# code-server.sh -- Run code-server with the bundled Node binary.

cd "$(dirname "$(readlink -f "$0" || realpath "$0")")" || exit 1

./node ./out/node/entry.js "$@"
