#!/bin/sh
set -eu

# This script is intended to be bundled into the standalone releases.
# Runs code-server with the bundled node binary.

_realpath() {
  # See https://github.com/coder/code-server/issues/1537 on why no realpath or readlink -f.

  script="$1"
  cd "$(dirname "$script")"

  while [ -L "$(basename "$script")" ]; do
    script="$(readlink "$(basename "$script")")"
    cd "$(dirname "$script")"
  done

  echo "$PWD/$(basename "$script")"
}

root() {
  script="$(_realpath "$0")"
  bin_dir="$(dirname "$script")"
  dirname "$bin_dir"
}

ROOT="$(root)"
exec "$ROOT/lib/node" "$ROOT" "$@"
