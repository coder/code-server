#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../../.."
  source ./ci/lib.sh

  docker run \
    -it \
    --rm \
    -v "$PWD:/src" \
    -w /src \
    -p 127.0.0.1:8080:8080 \
    -u "$(id -u):$(id -g)" \
    -e CI \
    "$(docker_build ./ci/images/debian8)" \
    "$@"
}

docker_build() {
  docker build "$@" >&2
  docker build -q "$@"
}

main "$@"
