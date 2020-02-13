#!/usr/bin/env bash
# ci.bash -- Build code-server in the CI.

set -euo pipefail

function target() {
	local os=$(uname | tr '[:upper:]' '[:lower:]')
	if [[ "$os" == "linux" ]]; then
		# Using the same strategy to detect Alpine as build.ts.
		local ldd_output=$(ldd --version 2>&1 || true)
		if echo "$ldd_output" | grep -iq musl; then
			os="alpine"
		fi
	fi

	echo "${os}-$(uname -m)"
}

function main() {
	cd "$(dirname "${0}")/.."

	# Get the version information. If a specific version wasn't set, generate it
	# from the tag and VS Code version.
	local vscode_version=${VSCODE_VERSION:-1.42.0}
	local code_server_version=${VERSION:-${TRAVIS_TAG:-${DRONE_TAG:-daily}}}

	# Remove everything that isn't the current VS Code source for caching
	# (otherwise the cache will contain old versions).
	if [[ -d "source/vscode-$vscode_version-source" ]] ; then
		mv "source/vscode-$vscode_version-source" "vscode-$vscode_version-source"
	fi
	rm -rf source/vscode-*-source
	if [[ -d "vscode-$vscode_version-source" ]] ; then
		mv "vscode-$vscode_version-source" "source/vscode-$vscode_version-source"
	fi

	YARN_CACHE_FOLDER="$(pwd)/yarn-cache"
	export YARN_CACHE_FOLDER

	# Always minify and package on tags since that's when releases are pushed.
	if [[ -n ${DRONE_TAG:-} || -n ${TRAVIS_TAG:-} ]] ; then
		export MINIFY="true"
		export PACKAGE="true"
	fi

	function run-yarn() {
		yarn "$1" "$vscode_version" "$code_server_version"
	}

	run-yarn build
	run-yarn binary
	if [[ -n ${PACKAGE:-} ]] ; then
		run-yarn package
	fi

	# In this case provide a plainly named "code-server" binary.
	if [[ -n ${BINARY:-} ]] ; then
		mv binaries/code-server*-vsc* binaries/code-server
	fi

	# Prepare GCS bucket directory on release.
	if [[ -n ${DRONE_TAG:-} || -n ${TRAVIS_TAG:-} ]] ; then
		local gcp_dir="gcs_bucket/releases/$code_server_version/$(target)"

		mkdir -p "$gcp_dir"
		mv binaries/code-server*-vsc* "$gcp_dir"
		if [[ "$(target)" == "linux-x86_64" ]] ; then
			mv binaries/code-server*-vsc* "gcs_bucket/latest-linux"
		fi
	fi
}

main "$@"
