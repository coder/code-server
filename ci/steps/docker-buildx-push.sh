#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."
  # NOTE@jsjoeio - this script assumes VERSION exists as an
  # environment variable.

  # NOTE@jsjoeio - this script assumes that you've downloaded
  # the release-packages artifact to ./release-packages before
  # running this docker buildx step
  docker buildx bake -f ci/release-image/docker-bake.hcl --push
}

main "$@"
