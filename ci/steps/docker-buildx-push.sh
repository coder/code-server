#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  # ci/lib.sh sets VERSION and provides download_artifact here
  source ./ci/lib.sh

  # Download the release-packages artifact
  download_artifact release-packages ./release-packages

  docker buildx bake -f ci/release-image/docker-bake.hcl --push
}

main "$@"
