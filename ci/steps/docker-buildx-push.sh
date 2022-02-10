#!/usr/bin/env bash
set -euo pipefail

# See if this version already exists on Docker Hub.
function version_exists() {
  local output
  output=$(curl --silent "https://index.docker.io/v1/repositories/codercom/code-server/tags/$VERSION")
  if [[ $output == "Tag not found" ]]; then
    return 1
  else
    return 0
  fi
}

main() {
  cd "$(dirname "$0")/../.."

  # ci/lib.sh sets VERSION and provides download_artifact here
  source ./ci/lib.sh

  if version_exists; then
    echo "$VERSION is already pushed"
    return
  fi

  # Download the release-packages artifact
  download_artifact release-packages ./release-packages

  docker buildx bake -f ci/release-image/docker-bake.hcl --push
}

main "$@"
