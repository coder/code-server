#!/usr/bin/env bash
set -euo pipefail

# Install dependencies in $1.
install-deps() {
  local args=()
  if [[ ${CI-} ]]; then
    args+=(ci)
  else
    args+=(install)
  fi
  # If there is no package.json then npm will look upward and end up installing
  # from the root resulting in an infinite loop (this can happen if you have not
  # checked out the submodule yet for example).
  if [[ ! -f "$1/package.json" ]]; then
    echo "$1/package.json is missing; did you run git submodule update --init?"
    exit 1
  fi
  pushd "$1"
  echo "Installing dependencies for $PWD"
  npm "${args[@]}"
  popd
}

main() {
  cd "$(dirname "$0")/../.."
  source ./ci/lib.sh

  install-deps test
  install-deps test/e2e/extensions/test-extension
  # We don't need these when running the integration tests
  # so you can pass SKIP_SUBMODULE_DEPS
  if [[ ! ${SKIP_SUBMODULE_DEPS-} ]]; then
    install-deps lib/vscode
  fi
}

main "$@"
