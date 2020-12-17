#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  yarn --frozen-lockfile
  yarn build
  yarn build:vscode
  yarn release

  # https://github.com/actions/upload-artifact/issues/38
  mkdir -p release-npm-package
  tar -czf release-npm-package/package.tar.gz release
}

main "$@"
