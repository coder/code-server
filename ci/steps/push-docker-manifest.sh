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

# Import and push the Docker image for the provided arch.
push() {
  local arch=$1
  local tag="codercom/code-server-$arch:$VERSION"

  docker import "./release-images/code-server-$arch-$VERSION.tar" "$tag"

  # We have to ensure the images exists on the remote registry in order to build
  # the manifest. We don't put the arch in the tag to avoid polluting the main
  # repository. These other repositories are private so they don't pollute our
  # organization namespace.
  docker push "$tag"

  export DOCKER_CLI_EXPERIMENTAL=enabled

  docker manifest create "codercom/code-server:$VERSION" \
    "codercom/code-server-$arch:$VERSION" \
    "codercom/code-server-$arch:$VERSION"
  docker manifest push --purge "codercom/code-server:$VERSION"
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
}

main "$@"
