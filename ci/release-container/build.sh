#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."
  source ./ci/lib.sh
  VERSION="$(pkg_json_version)"

  imageTag="codercom/code-server:$VERSION"

  docker build -t "$imageTag" -f ./ci/release-container/Dockerfile .
}

main "$@"
