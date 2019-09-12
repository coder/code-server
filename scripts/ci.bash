#!/bin/bash
set -euo pipefail

# Build using a Docker container.
function docker-build() {
	local target="${TARGET:-}"
	local image="codercom/nbin-${target}"
	local token="${GITHUB_TOKEN:-}"
	local minify="${MINIFY:-}"
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
	else
		# TODO: at some point git existed but it seems to have disappeared.
		docker exec "${containerId}" yum install -y libxkbfile-devel libsecret-devel git
	fi

	function docker-exec() {
		local command="${1}" ; shift
		local args="'${vscodeVersion}' '${codeServerVersion}'"
		docker exec "${containerId}" \
			bash -c "cd /src && CI=true GITHUB_TOKEN=${token} MINIFY=${minify} yarn ${command} ${args}"
	}

	docker cp ./. "${containerId}":/src
	docker-exec build
	if [[ -n "${package}" ]] ; then
		docker-exec binary
		docker-exec package
		mkdir -p release
		docker cp "${containerId}":/src/release/. ./release/
	fi

	docker stop "${containerId}"
}

# Build locally.
function local-build() {
	function local-exec() {
		local command="${1}" ; shift
		CI=true yarn "${command}" "${vscodeVersion}" "${codeServerVersion}"
	}

	local-exec build
	if [[ -n "${package}" ]] ; then
		local-exec binary
		local-exec package
	fi
}

# Build code-server in the CI.
function main() {
	cd "$(dirname "${0}")/.."

	local codeServerVersion="${VERSION:-}"
	local vscodeVersion="${VSCODE_VERSION:-}"
	local ostype="${OSTYPE:-}"
	local package="${PACKAGE:-}"

	if [[ -z "${codeServerVersion}" ]] ; then
		>&2 echo "Must set VERSION environment variable"; exit 1
	fi

	if [[ -z "${vscodeVersion}" ]] ; then
		>&2 echo "Must set VSCODE_VERSION environment variable"; exit 1
	fi

	if [[ "${ostype}" == "darwin"* ]]; then
		local-build
	else
		docker-build
	fi
}

main "$@"
