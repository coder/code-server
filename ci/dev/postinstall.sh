#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  echo 'Installing code-server test dependencies...'

  cd test
  yarn install
  cd ..

  cd vendor
  echo 'Installing vendor dependencies...'

  # * We install in 'modules' instead of 'node_modules' because VS Code's extensions
  # use a webpack config which cannot differentiate between its own node_modules
  # and itself being in a directory with the same name.
  #
  # * We ignore scripts because NPM/Yarn's default behavior is to assume that
  # devDependencies are not needed, and that even git repo based packages are
  # assumed to be compiled. Because the default behavior for VS Code's `postinstall`
  # assumes we're also compiled, this needs to be ignored.
  yarn install --modules-folder modules --ignore-scripts --frozen-lockfile

  # Finally, run the vendor `postinstall`
  yarn run postinstall
}

main "$@"
