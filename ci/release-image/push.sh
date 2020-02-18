#!/usr/bin/env bash

set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  if [[ ${CI:-} ]]; then
    echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
  fi

  imageTag="codercom/code-server:$VERSION"
  latest="codercom/code-server:latest"
  if [[ $TRAVIS_CPU_ARCH == "arm64" ]]; then
    imageTag+="-arm64"
    latest="codercom/code-server:arm64"
  fi
  docker build -t "$imageTag" -t "$latest" -f ./ci/release-image/Dockerfile
  docker push codercom/code-server
}

main "$@"
