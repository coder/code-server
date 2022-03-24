#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."
  # ci/lib.sh sets VERSION so it's available to ci/release-image/docker-bake.hcl
  # to push the VERSION tag.
  source ./ci/lib.sh

  # NOTE@jsjoeio - this script assumes that you've downloaded
  # the release-packages artifact to ./release-packages before
  # running this docker buildx step
  docker buildx bake -f ci/release-image/docker-bake.hcl --push
}

main "$@"
