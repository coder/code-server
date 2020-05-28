#!/bin/sh

# This script is intended to be bundled into the standalone releases.
# Runs code-server with the bundled node binary.

# More complicated than readlink -f or realpath to support macOS.
# See https://github.com/cdr/code-server/issues/1537
root_dir() {
  # We read the symlink, which may be relative from $0.
  dst="$(readlink "$0")"
  # We cd into the $0 directory.
  cd "$(dirname "$0")" || exit 1
  # Now we can cd into the directory above the dst directory which is the root
  # of the release.
  cd "$(dirname "$dst")/.." || exit 1
  # Finally we use pwd -P to print the absolute path the root.
  pwd -P || exit 1
}

ROOT="$(root_dir)"
if [ "$(uname)" = "Linux" ]; then
  export LD_LIBRARY_PATH="$ROOT/lib:$LD_LIBRARY_PATH"
elif [ "$(uname)" = "Darwin" ]; then
  export DYLD_LIBRARY_PATH="$ROOT/lib:$DYLD_LIBRARY_PATH"
fi
exec "$ROOT/lib/node" "$ROOT" "$@"
