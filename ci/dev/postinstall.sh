#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."
  source ./ci/lib.sh

  pushd test
  echo "Installing dependencies for $PWD"
  yarn install
  popd

  pushd test/e2e/extensions/test-extension
  echo "Installing dependencies for $PWD"
  yarn install
  popd

  pushd vendor
  echo "Installing dependencies for $PWD"

  # * We install in 'modules' instead of 'node_modules' because VS Code's extensions
  # use a webpack config which cannot differentiate between its own node_modules
  # and itself being in a directory with the same name.
  #
  # * We ignore scripts because NPM/Yarn's default behavior is to assume that
  # devDependencies are not needed, and that even git repo based packages are
  # assumed to be compiled. Because the default behavior for VS Code's `postinstall`
  # assumes we're also compiled, this needs to be ignored.

  local args=(install --modules-folder modules --ignore-scripts)

  if [[ ${CI-} ]]; then
    args+=("--frozen-lockfile")
  fi

  yarn "${args[@]}"

  # Finally, run the vendor `postinstall`
  yarn run postinstall

  popd
}

main "$@"
