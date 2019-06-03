#!/bin/bash
set -euxo pipefail

# Build using a Docker container using the specified image and version.
function docker_build() {
	local image="${1}" ; shift
	local version="${1}" ; shift

	local containerId
	containerId=$(docker create --network=host --rm -it -v "$(pwd)"/.cache:/src/.cache "${image}")
	docker start "${containerId}"
	docker exec "${containerId}" mkdir -p /src

	function docker_exec() {
		docker exec "${containerId}" bash -c "$@"
	}

	docker cp ./. "${containerId}":/src
	docker_exec "cd /src && yarn"
	docker_exec "cd /src && npm rebuild"
	docker_exec "cd /src && NODE_ENV=production VERSION=${version} yarn task build:server:binary"
	docker_exec "cd /src && yarn task package ${version}"
	docker cp "${containerId}":/src/release/. ./release/

	docker stop "${containerId}"
}

function main() {
	local version=${VERSION:-}
	local ostype=${OSTYPE:-}

	if [[ -z "${version}" ]] ; then
		>&2 echo "Must set VERSION environment variable"
		exit 1
	fi

	if [[ "${ostype}" == "darwin"* ]]; then
		NODE_ENV=production VERSION="${version}" yarn task build:server:binary
		yarn task package "${version}"
	else
		local image
		if [[ "$TARGET" == "alpine" ]]; then
			image="codercom/nbin-alpine"
		else
			image="codercom/nbin-centos"
		fi
		docker_build "${image}" "${version}"
	fi
}

main "$@"
