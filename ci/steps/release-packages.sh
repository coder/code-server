#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  NODE_VERSION=v12.18.4
  NODE_OS="$(uname | tr '[:upper:]' '[:lower:]')"
  NODE_ARCH="$(uname -m | sed 's/86_64/64/; s/aarch64/arm64/')"
  if [ "$NODE_OS" = "freebsd" ]; then
    mkdir -p "$PWD/node-$NODE_VERSION-$NODE_OS-$NODE_ARCH/bin"
    cp "$(which node)" "$PWD/node-$NODE_VERSION-$NODE_OS-$NODE_ARCH/bin"
  else
    curl -L "https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-$NODE_OS-$NODE_ARCH.tar.gz" | tar -xz
  fi
  PATH="$PWD/node-$NODE_VERSION-$NODE_OS-$NODE_ARCH/bin:$PATH"

  # https://github.com/actions/upload-artifact/issues/38
  tar -xzf release-npm-package/package.tar.gz

  yarn release:standalone
  yarn test:standalone-release
  yarn package
}

main "$@"
