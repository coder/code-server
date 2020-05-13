#!/usr/bin/env sh
set -eu

main() {
  cd lib/vscode

  # We have to rename node_modules.bundled to node_modules.
  # The bundled modules were renamed originally to avoid being ignored by yarn.
  local node_modules
  node_modules="$(find . -depth -name "node_modules.bundled")"
  local nm
  for nm in $node_modules; do
    rm -Rf "${nm%.bundled}"
    mv "$nm" "${nm%.bundled}"
  done

  # Rebuilds native modules.
  npm rebuild
}

main "$@"
