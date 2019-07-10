#!/bin/bash
set -euo pipefail

# Build using a Docker container.
function docker-build() {
	local containerId
	containerId=$(docker create --network=host --rm -it -v "$(pwd)"/.cache:/src/.cache "${image}")
	docker start "${containerId}"
	docker exec "${containerId}" mkdir -p /src

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
		local image
		if [[ "${target}" == alpine ]]; then
			image=codercom/nbin-alpine
			target=musl
		else
			image=codercom/nbin-centos
			target=linux
		fi
		docker-build
	fi
}

main "$@"
