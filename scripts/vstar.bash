#!/bin/bash
set -euxo pipefail

# Build a tarfile containing vscode sourcefiles neccessary for CI.
# Done outside the CI and uploaded to object storage to reduce CI time.
function main() {
	local version=${1:-}
	if [[ -z "${version}" ]] ; then
		>&2 echo "Usage: $(basename "${0}") VERSION"
		exit 1
	fi

	local dir=/tmp/vstar
	local outfile="/tmp/vscode-${version}-prebuilt.tar.gz"
	rm -rf "${dir}"
	mkdir -p "${dir}"

	cd "${dir}"
	git clone https://github.com/microsoft/vscode \
		--branch "${version}" --single-branch --depth=1
	cd vscode

	yarn
	npx gulp vscode-linux-x64 --max-old-space-size=32384

	tar -czvf "${outfile}" "${dir}"
}

main "$@"
