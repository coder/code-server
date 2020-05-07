#!/usr/bin/env bash

set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."
  source ./ci/lib.sh
  VERSION="$(pkg_json_version)"

  if [[ ${CI-} ]]; then
    echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
  fi

  imageTag="codercom/code-server:$VERSION"
  if [[ $(arch) == "arm64" ]]; then
    imageTag+="-arm64"
  fi

  docker build \
    -t "$imageTag" \
    -f ./ci/release-container/Dockerfile .
  docker push "$imageTag"
}

main "$@"
