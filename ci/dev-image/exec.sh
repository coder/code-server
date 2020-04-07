#!/usr/bin/env bash

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
    --privileged \
    --name $container_name \
    "-v=$PWD:/code-server" \
    "-w=/code-server" \
    "-p=8080:8080" \
    $([[ -t 0 ]] && echo -it || true) \
    -d \
    $container_name)
}

build() {
  echo "--- Building $container_name"
  cd ../../ && docker build -t $container_name -f ./ci/dev-image/Dockerfile . > /dev/null
}

set +e
container_id=$(docker container inspect --format="{{.Id}}" $container_name 2> /dev/null)

if [ $? -eq "0" ]; then
  set -e
  echo "-- Starting container"
  docker start $container_id > /dev/null

  enter
  exit 0
fi

set -e
build
run
enter
