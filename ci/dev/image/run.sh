#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../../.."
  source ./ci/lib.sh
  mkdir -p .home

  docker run \
    -it \
    --rm \
    -v "$PWD:/src" \
    -e HOME="/src/.home" \
    -e USER="coder" \
    -e GITHUB_TOKEN \
    -e KEEP_MODULES \
    -e MINIFY \
    -w /src \
    -p 127.0.0.1:8080:8080 \
    -u "$(id -u):$(id -g)" \
    -e CI \
    "$(docker_build ./ci/images/"${IMAGE-debian10}")" \
    "$@"
}

docker_build() {
  docker build "$@" >&2
  docker build -q "$@"
}

main "$@"
