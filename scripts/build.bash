#!/bin/bash
set -euxo pipefail

# Build using a Docker container using the specified image and version.
function docker_build() {
	local image="${1}" ; shift
	local version="${1}" ; shift
	local ci=${CI:-}

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
	docker_exec "cd /src && VERSION=${version} CI=${ci} yarn build"
	docker_exec "cd /src && yarn bundle"
	docker_exec "cd /src && yarn package ${version}"
	docker cp "${containerId}":/src/release/. ./release/

	docker stop "${containerId}"
}

function main() {
	local version=${VERSION:-}
	local ostype=${OSTYPE:-}
	local target=${TARGET:-}

	if [[ -z "${version}" ]] ; then
		>&2 echo "Must set VERSION environment variable"
		exit 1
	fi

	if [[ "${ostype}" == "darwin"* ]]; then
		VERSION="${version}" yarn build
		yarn bundle
		yarn package "${version}"
	else
		local image
		if [[ "${target}" == "alpine" ]]; then
			image="codercom/nbin-alpine"
		else
			image="codercom/nbin-centos"
		fi
		docker_build "${image}" "${version}"
	fi
}

main "$@"
