#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."
  source ./ci/lib.sh

  # npm view won't exit with non-zero so we have to check the output.
  local hasVersion
  hasVersion=$(npm view "code-server@$VERSION" version)
  if [[ $hasVersion == "$VERSION" ]]; then
    echo "$VERSION is already published"
    return
  fi

  if [[ ${CI-} ]]; then
    echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc
  fi

  download_artifact npm-package ./release-npm-package
  # https://github.com/actions/upload-artifact/issues/38
  tar -xzf release-npm-package/package.tar.gz

  # Ignore symlink when publishing npm package
  # See: https://github.com/cdr/code-server/pull/3935
  echo "node_modules.asar" > release/.npmignore
  yarn publish --non-interactive release
}

main "$@"
