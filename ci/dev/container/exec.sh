#!/usr/bin/env bash
set -euo pipefail

# Opens an interactive bash session inside of a docker container
# for improved isolation during development.
# If the container exists it is restarted if necessary, then reused.

main() {
  cd "$(dirname "${0}")/../../.."

  local container_name=code-server-dev

  if docker inspect $container_name &> /dev/null; then
    echo "-- Starting container"
    docker start "$container_name" > /dev/null

    enter
    exit 0
  fi

  build
  run
  enter
}

enter() {
  echo "--- Entering $container_name"
  docker exec -it "$container_name" /bin/bash
}

run() {
  echo "--- Spawning $container_name"
  docker run \
    -it \
    --name $container_name \
    "-v=$PWD:/code-server" \
    "-w=/code-server" \
    "-p=127.0.0.1:8080:8080" \
    $(if [[ -t 0 ]]; then echo -it; fi) \
    "$container_name"
}

build() {
  echo "--- Building $container_name"
  docker build -t $container_name ./ci/dev/container > /dev/null
}

main "$@"
