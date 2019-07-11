#!/bin/bash
set -euo pipefail

# Build using a Docker container.
function docker-build() {
	local image="codercom/nbin-${target}"
	if [[ "${target}" == "linux" ]] ; then
		image="codercom/nbin-centos"
	fi

	local containerId
	containerId=$(docker create --network=host --rm -it -v "$(pwd)"/.cache:/src/.cache "${image}")
	docker start "${containerId}"
	docker exec "${containerId}" mkdir -p /src

	# TODO: temporary as long as we are rebuilding modules.
	if [[ "${image}" == "codercom/nbin-alpine" ]] ; then
		docker exec "${containerId}" apk add libxkbfile-dev libsecret-dev
	fi

	function docker-exec() {
		local command="${1}" ; shift
		local args="'${codeServerVersion}' '${vscodeVersion}' '${target}' '${arch}'"
		docker exec "${containerId}" \
			bash -c "cd /src && CI=true yarn ${command} ${args}"
	}

	docker cp ./. "${containerId}":/src
	docker-exec build
	docker-exec binary
	docker-exec package
	docker cp "${containerId}":/src/release/. ./release/

	docker stop "${containerId}"
}

# Build locally.
function local-build() {
	function local-exec() {
		local command="${1}" ; shift
		CI=true yarn "${command}" \
			"${codeServerVersion}" "${vscodeVersion}" "${target}" "${arch}"
	}

	local-exec build
	local-exec binary
	local-exec package
}

# Build code-server in the CI.
function main() {
	local codeServerVersion="${VERSION:-}"
	local vscodeVersion="${VSCODE_VERSION:-}"
	local ostype="${OSTYPE:-}"
	local target="${TARGET:-}"
	local arch=x64

	if [[ -z "${codeServerVersion}" ]] ; then
		>&2 echo "Must set VERSION environment variable"; exit 1
	fi

	if [[ -z "${vscodeVersion}" ]] ; then
		>&2 echo "Must set VSCODE_VERSION environment variable"; exit 1
	fi

	if [[ "${ostype}" == "darwin"* ]]; then
		target=darwin
		local-build
	else
		docker-build
	fi
}

main "$@"
