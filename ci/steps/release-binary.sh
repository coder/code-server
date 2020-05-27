#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  # https://github.com/actions/upload-artifact/issues/38
  tar -xzf release-npm-package/package.tar.gz

  yarn release:binary
  yarn test:binary-release
  yarn package
}

main "$@"
