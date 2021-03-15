#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."
  source ./ci/lib.sh

  if [[ ${CI-} ]]; then
    echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" >~/.npmrc
  fi

  download_artifact npm-package ./release-npm-package
  # https://github.com/actions/upload-artifact/issues/38
  tar -xzf release-npm-package/package.tar.gz
  yarn publish --non-interactive release
}

main "$@"
