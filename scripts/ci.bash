#!/usr/bin/env bash
# ci.bash -- Build code-server in the CI.

set -euo pipefail

function main() {
	cd "$(dirname "${0}")/.."

	# Get the version information. If a specific version wasn't set, generate it
	# from the tag and VS Code version.
	local vscode_version=${VSCODE_VERSION:-1.41.1}
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
}

main "$@"
