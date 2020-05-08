#!/usr/bin/env bash

set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."
  source ./ci/lib.sh
  VERSION="$(pkg_json_version)"

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
