#!/bin/bash
set -euxo pipefail

# Variables to be set:
# $IMAGE
function docker_build() {
	containerID=$(docker create -it -v $(pwd)/.cache:/src/.cache $IMAGE)
	docker start $containerID
	docker exec $containerID mkdir -p /src

	function exec() {
		docker exec $containerID bash -c "$@"
	}

	docker cp ./. $containerID:/src
	exec "cd /src && yarn"
	exec "cd /src && npm rebuild"
	exec "cd /src && yarn task build:server:binary"
	exec "cd /src && yarn task package $VERSION"
	docker cp $containerID:/src/release/. ./release/
}

if [[ "$OSTYPE" == "darwin"* ]]; then
	yarn task build:server:binary
else
	if [[ "$TARGET" == "alpine" ]]; then
		IMAGE="codercom/nbin-alpine"
	else
		IMAGE="codercom/nbin-centos"
	fi
	docker_build
fi
