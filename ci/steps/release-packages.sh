#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  if [[ $OSTYPE == darwin* ]]; then
    NODE_VERSION=v12.18.3
    curl -L "https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-darwin-x64.tar.gz" | tar -xz
    PATH="$PWD/node-$NODE_VERSION-darwin-x64/bin:$PATH"
  fi

  # https://github.com/actions/upload-artifact/issues/38
  tar -xzf release-npm-package/package.tar.gz

  yarn release:standalone
  yarn test:standalone-release
  yarn package
}

main "$@"
