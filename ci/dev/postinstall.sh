#!/usr/bin/env bash
set -euo pipefail

# Install dependencies in $1.
install-deps() {
  local args=(install)
  if [[ ${CI-} ]]; then
    args+=(--frozen-lockfile)
  fi
  pushd "$1"
    echo "Installing dependencies for $PWD"
    yarn "${args[@]}"
  popd
}

main() {
  cd "$(dirname "$0")/../.."
  source ./ci/lib.sh

  install-deps test
  install-deps test/e2e/extensions/test-extension
  install-deps lib/vscode
}

main "$@"
