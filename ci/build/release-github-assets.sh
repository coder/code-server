#!/usr/bin/env bash
set -euo pipefail

# Downloads the release artifacts from CI for the current
# commit and then uploads them to the release with the version
# in package.json.
# You will need $GITHUB_TOKEN set.

main() {
  cd "$(dirname "$0")/../.."
  source ./ci/lib.sh
  source ./ci/steps/steps-lib.sh

  # NOTE@jsjoeio - only needed if we use the download_artifact
  # because we talk to the GitHub API.
  # Needed to use GitHub API
  if ! is_env_var_set "GITHUB_TOKEN"; then
    echo "GITHUB_TOKEN is not set. Cannot download npm release-packages without GitHub credentials."
    exit 1
  fi

  download_artifact release-packages ./release-packages
  local assets=(./release-packages/code-server*"$VERSION"*{.tar.gz,.deb,.rpm})

  EDITOR=true gh release upload "v$VERSION" "${assets[@]}" --clobber
}

main "$@"
