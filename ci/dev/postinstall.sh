#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."
  source ./ci/lib.sh

  pushd test
  echo "Installing dependencies for $PWD"
  yarn install
  popd

  local args=(install)
  if [[ ${CI-} ]]; then
    args+=(--frozen-lockfile)
  fi

  pushd test
  echo "Installing dependencies for $PWD"
  yarn "${args[@]}"
  popd

  pushd test/e2e/extensions/test-extension
  echo "Installing dependencies for $PWD"
  yarn "${args[@]}"
  popd

  pushd vendor
  echo "Installing dependencies for $PWD"

  # We install in 'modules' instead of 'node_modules' because VS Code's
  # extensions use a webpack config which cannot differentiate between its own
  # node_modules and itself being in a directory with the same name.
  args+=(--modules-folder modules)

  # We ignore scripts because NPM/Yarn's default behavior is to assume that
  # devDependencies are not needed, and that even git repo based packages are
  # assumed to be compiled. Because the default behavior for VS Code's
  # `postinstall` assumes we're also compiled, this needs to be ignored.
  args+=(--ignore-scripts)

  yarn "${args[@]}"

  # Finally, run the vendor `postinstall`
  yarn run postinstall

  popd
}

main "$@"
