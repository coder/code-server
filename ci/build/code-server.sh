#!/bin/sh
set -eu

# This script is intended to be bundled into the standalone releases.
# Runs code-server with the bundled node binary.

_realpath() {
  if [ "$(uname)" = "Linux" ]; then
    readlink -f "$1"
    return
  fi

  # See https://github.com/cdr/code-server/issues/1537
  if [ "$(uname)" = "Darwin" ]; then
    # We read the symlink, which may be relative from $1.
    script="$1"
    if [ -L "$script" ]; then
      while [ -L "$script" ]; do
        script="$(readlink "$script")"
        cd "$(dirname "$script")"
      done
    else
      cd "$(dirname "$script")"
    fi

    echo "$PWD/$(basename "$script")"
    return
  fi

  echo "Unsupported OS $(uname)" >&2
  exit 1
}

ROOT="$(dirname "$(dirname "$(_realpath "$0")")")"
if [ "$(uname)" = "Linux" ]; then
  export LD_LIBRARY_PATH="$ROOT/lib:${LD_LIBRARY_PATH-}"
elif [ "$(uname)" = "Darwin" ]; then
  export DYLD_LIBRARY_PATH="$ROOT/lib:${DYLD_LIBRARY_PATH-}"
fi
exec "$ROOT/lib/node" "$ROOT" "$@"
