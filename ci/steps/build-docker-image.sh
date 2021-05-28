#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."
  source ./ci/lib.sh

  mkdir -p release-images
  docker buildx bake -f ci/release-image/docker-bake.hcl
}

main "$@"
