#!/usr/bin/env bash
set -euo pipefail

# Downloads the release artifacts from CI for the current
# commit and then uploads them to the release with the version
# in package.json.
# You will need $GITHUB_TOKEN set.

main() {
  cd "$(dirname "$0")/../.."
  source ./ci/lib.sh

  download_artifact release-packages ./release-packages
  local assets=(./release-packages/code-server*"$VERSION"*{.tar.gz,.deb,.rpm})

  EDITOR=true gh release upload "v$VERSION" "${assets[@]}"
}

main "$@"
