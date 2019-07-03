#!/bin/bash
set -euo pipefail

# Build using a Docker container using the specified image and version.
function docker-build() {
	local image="${1}" ; shift
	local version="${1}" ; shift
	local vscodeVersion="${1}" ; shift
	local target="${1}" ; shift
	local arch="${1}" ; shift

	local containerId
	containerId=$(docker create --network=host --rm -it -v "$(pwd)"/.cache:/src/.cache "${image}")
	docker start "${containerId}"
	docker exec "${containerId}" mkdir -p /src

	function docker-exec() {
		docker exec "${containerId}" bash -c "$@"
	}

	docker cp ./. "${containerId}":/src
	docker-exec "cd /src && CI=true yarn build \"${vscodeVersion}\" \"${target}\" \"${arch}\""
	docker-exec "cd /src && CI=true yarn binary \"${vscodeVersion}\" \"${target}\" \"${arch}\""
	docker-exec "cd /src && CI=true yarn package \"${vscodeVersion}\" \"${target}\" \"${arch}\" \"${version}\""
	docker cp "${containerId}":/src/release/. ./release/

	docker stop "${containerId}"
}

# Build code-server in the CI.
function main() {
	local version="${VERSION:-}"
	local vscodeVersion="${VSCODE_VERSION:-}"
	local ostype="${OSTYPE:-}"
	local target="${TARGET:-}"
	local arch=x64

	if [[ -z "${version}" ]] ; then
		>&2 echo "Must set VERSION environment variable"; exit 1
	fi

	if [[ -z "${vscodeVersion}" ]] ; then
		>&2 echo "Must set VSCODE_VERSION environment variable"; exit 1
	fi

	if [[ "${ostype}" == "darwin"* ]]; then
		target=darwin
		CI=true yarn build "${vscodeVersion}" "${target}" "${arch}"
		CI=true yarn binary "${vscodeVersion}" "${target}" "${arch}"
		CI=true yarn package "${vscodeVersion}" "${target}" "${arch}" "${version}"
	else
		local image
		if [[ "${target}" == alpine ]]; then
			image=codercom/nbin-alpine
			target=musl
		else
			image=codercom/nbin-centos
			target=linux
		fi
		docker-build "${image}" "${version}" "${vscodeVersion}" "${target}" "${arch}"
	fi
}

main "$@"
