#!/usr/bin/env bash
set -euo pipefail

# Install dependencies in $1.
install-deps() {
  local args=(install)
  if [[ ${CI-} ]]; then
    args+=(--frozen-lockfile)
  fi
  if [[ "$1" == "lib/vscode" ]]; then
    args+=(--no-default-rc)
  fi
  # If there is no package.json then yarn will look upward and end up installing
  # from the root resulting in an infinite loop (this can happen if you have not
  # checked out the submodule yet for example).
  if [[ ! -f "$1/package.json" ]]; then
    echo "$1/package.json is missing; did you run git submodule update --init?"
    exit 1
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
