#!/usr/bin/env sh
# code-server.sh -- Run code-server with the bundled Node binary.

dir="$(dirname "$(readlink -f "$0" || realpath "$0")")"

exec "$dir/node" "$dir/out/node/entry.js" "$@"
