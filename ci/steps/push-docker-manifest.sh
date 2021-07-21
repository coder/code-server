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

# Import and push the Docker image for the provided arch. We must have
# individual arch repositories pushed remotely in order to use `docker
# manifest` to create single a multi-arch image.
# TODO: Switch to buildx? Seems it can do this more simply.
push() {
  local arch=$1
  local tag="codercom/code-server-$arch:$VERSION"
  docker import "./release-images/code-server-$arch-$VERSION.tar" "$tag"
  docker push "$tag"
}

main() {
  cd "$(dirname "$0")/../.."
  source ./ci/lib.sh

  if version_exists; then
    echo "$VERSION is already pushed"
    return
  fi

  download_artifact release-images ./release-images
  if [[ ${CI-} ]]; then
    echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
  fi

  push "amd64"
  push "arm64"

  export DOCKER_CLI_EXPERIMENTAL=enabled

  docker manifest create "codercom/code-server:$VERSION" \
    "codercom/code-server-amd64:$VERSION" \
    "codercom/code-server-arm64:$VERSION"
  docker manifest push --purge "codercom/code-server:$VERSION"

  docker manifest create "codercom/code-server:latest" \
    "codercom/code-server-amd64:$VERSION" \
    "codercom/code-server-arm64:$VERSION"
  docker manifest push --purge "codercom/code-server:latest"
}

main "$@"
