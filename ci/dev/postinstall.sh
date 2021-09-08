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

  # Ignore scripts to prevent partial install which omits development dependencies.
  yarn install --modules-folder modules --ignore-scripts
  yarn run postinstall
}

main "$@"
