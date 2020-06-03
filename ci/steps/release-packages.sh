#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  if [[ $OSTYPE == darwin* ]]; then
    curl -L https://nodejs.org/dist/v14.4.0/node-v14.4.0-darwin-x64.tar.gz | tar -xz
    PATH="$PATH:node-v14.4.0-darwin-x64/bin"
  fi

  # https://github.com/actions/upload-artifact/issues/38
  tar -xzf release-npm-package/package.tar.gz

  yarn release:standalone
  yarn test:standalone-release
  yarn package
}

main "$@"
