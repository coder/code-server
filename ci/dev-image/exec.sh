#!/usr/bin/env bash
# exec.sh opens an interactive bash session inside of a docker container
# for improved isolation during development
# if the container exists it is restarted if necessary, then reused

set -euo pipefail
cd "$(dirname "$0")"

# Ensure submodules are cloned and up to date.
git submodule update --init

container_name=code-server-dev

enter() {
  echo "--- Entering $container_name"
  docker exec -it $container_id /bin/bash
}

run() {
  echo "--- Spawning $container_name"
  container_id=$(docker run \
    -it \
    --name $container_name \
    "-v=$PWD:/code-server" \
    "-w=/code-server" \
    "-p=127.0.0.1:8080:8080" \
    $([[ -t 0 ]] && echo -it || true) \
    $container_name)
}

build() {
  echo "--- Building $container_name"
  cd ../../
  docker build -t $container_name -f ./ci/dev-image/Dockerfile . > /dev/null
}

container_id=$(docker container inspect --format="{{.Id}}" $container_name 2> /dev/null) || true

if [ "$container_id" != "" ]; then
  echo "-- Starting container"
  docker start $container_id > /dev/null

  enter
  exit 0
fi

build
run
enter
