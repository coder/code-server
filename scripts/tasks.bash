#!/bin/bash
set -euox pipefail

function log() {
	local message="${1}" ; shift
	local level="${1:-info}"
	if [[ "${level}" == "error" ]] ; then
		>&2 echo "${message}"
	else
		echo "${message}"
	fi
}

# Copy code-server into VS Code along with its dependencies.
function copy-server() {
	local serverPath="${sourcePath}/src/vs/server"
	rm -rf "${serverPath}"
	mkdir -p "${serverPath}"

	cp -r "${rootPath}/src" "${serverPath}"
	cp -r "${rootPath}/typings" "${serverPath}"
	cp "${rootPath}/main.js" "${serverPath}"
	cp "${rootPath}/package.json" "${serverPath}"
	cp "${rootPath}/yarn.lock" "${serverPath}"

	if [[ -d "${rootPath}/node_modules" ]] ; then
		cp -r "${rootPath}/node_modules" "${serverPath}"
	else
		# Ignore scripts to avoid also installing VS Code dependencies which has
		# already been done.
		cd "${serverPath}" && yarn --ignore-scripts
		rm -r node_modules/@types/node # I keep getting type conflicts
	fi

	# TODO: Duplicate identifier issue. There must be a better way to fix this.
	if [[ "${target}" == "darwin" ]] ; then
		rm "${serverPath}/node_modules/fsevents/node_modules/safe-buffer/index.d.ts"
	fi
}

# Prepend the nbin shim which enables finding files within the binary.
function prepend-loader() {
	local filePath="${buildPath}/${1}" ; shift
	cat "${rootPath}/scripts/nbin-shim.js" "${filePath}" > "${filePath}.temp"
	mv "${filePath}.temp" "${filePath}"
	# Using : as the delimiter so the escaping here is easier to read.
	# ${parameter/pattern/string}, so the pattern is /: (if the pattern starts
	# with / it matches all instances) and the string is \\: (results in \:).
	if [[ "${target}" == "darwin" ]] ; then
		sed -i "" -e "s:{{ROOT_PATH}}:${buildPath//:/\\:}:g" "${filePath}"
	else
		sed -i "s:{{ROOT_PATH}}:${buildPath//:/\\:}:g" "${filePath}"
	fi
}

# Copy code-server into VS Code then build it.
function build-code-server() {
	copy-server
	cd "${sourcePath}" && yarn gulp compile-build --max-old-space-size=32384

	local min=""
	if [[ -n "${minify}" ]] ; then
		min="-min"
		yarn gulp minify-vscode --max-old-space-size=32384
	else
		yarn gulp optimize-vscode --max-old-space-size=32384
	fi

	rm -rf "${buildPath}"
	mkdir -p "${buildPath}"

	# Rebuild to make sure native modules work on the target system.
	cp "${sourcePath}/remote/"{package.json,yarn.lock,.yarnrc} "${buildPath}"
	cd "${buildPath}" && yarn --production --force --build-from-source
	rm "${buildPath}/"{package.json,yarn.lock,.yarnrc}

	cp -r "${sourcePath}/.build/extensions" "${buildPath}"
	cp -r "${sourcePath}/out-vscode${min}" "${buildPath}/out"
	node "${rootPath}/scripts/build-json.js" "${sourcePath}" "${buildPath}" "${vscodeVersion}" "${codeServerVersion}"

	# Only keep production dependencies for the server.
	cp "${rootPath}/"{package.json,yarn.lock} "${buildPath}/out/vs/server"
	cd "${buildPath}/out/vs/server" && yarn --production --ignore-scripts
	rm "${buildPath}/out/vs/server/"{package.json,yarn.lock}

	# onigasm 2.2.2 has a bug that makes it broken for PHP files so use 2.2.1.
	# https://github.com/NeekSandhu/onigasm/issues/17
	local onigasmPath="${buildPath}/node_modules/onigasm-umd"
	rm -rf "${onigasmPath}"
	git clone "https://github.com/alexandrudima/onigasm-umd" "${onigasmPath}"
	cd "${onigasmPath}" && yarn && yarn add --dev onigasm@2.2.1 && yarn package
	mkdir "${onigasmPath}-temp"
	mv "${onigasmPath}/"{release,LICENSE} "${onigasmPath}-temp"
	rm -rf "${onigasmPath}"
	mv "${onigasmPath}-temp" "${onigasmPath}"

	prepend-loader "out/vs/server/main.js"
	prepend-loader "out/bootstrap-fork.js"
	prepend-loader "extensions/node_modules/typescript/lib/tsserver.js"

	log "Final build: ${buildPath}"
}

# Download and extract a tar from a URL with either curl or wget depending on
# which is available.
function download-tar() {
	local url="${1}" ; shift
	if command -v wget &> /dev/null ; then
		wget "${url}" --quiet -O - | tar -C "${stagingPath}" -xz
	else
		curl "${url}" --silent --fail | tar -C "${stagingPath}" -xz
	fi
}

# Download a pre-built package. If it doesn't exist and we are in the CI, exit.
# Otherwise the return will be whether it existed or not. The pre-built package
# is provided to reduce CI build time.
function download-pre-built() {
	local archiveName="${1}" ; shift
	local url="https://codesrv-ci.cdr.sh/${archiveName}"
	if ! download-tar "${url}" ; then
		if [[ -n "${ci}" ]] ; then
			log "${url} does not exist" "error"
			exit 1
		fi
		return 1
	fi
	return 0
}

# Fully build code-server.
function build-task() {
	mkdir -p "${stagingPath}"
	if [[ ! -d "${sourcePath}" ]] ; then
		if ! download-pre-built "vscode-${vscodeVersion}.tar.gz" ; then
			git clone https://github.com/microsoft/vscode --quiet \
				--branch "${vscodeVersion}" --single-branch --depth=1 \
				"${sourcePath}"
		fi
	fi
	cd "${sourcePath}"
	git reset --hard && git clean -fd
	git apply "${rootPath}/scripts/vscode.patch"
	if [[ ! -d "${sourcePath}/node_modules" ]] ; then
		if [[ -n "${ci}" ]] ; then
			log "Pre-built VS Code ${vscodeVersion} has no node_modules" "error"
			exit 1
		fi
		yarn
	fi
	if [[ ! -d "${sourcePath}/.build/extensions" ]] ; then
		if [[ -n "${ci}" ]] ; then
			log "Pre-built VS Code ${vscodeVersion} has no built extensions" "error"
			exit 1
		fi
		yarn gulp compile-extensions-build --max-old-space-size=32384
	fi
	build-code-server
}

# Package the binary into a tar or zip for release.
function package-task() {
	local archivePath="${releasePath}/${binaryName}"
	rm -rf "${archivePath}"
	mkdir -p "${archivePath}"

	cp "${buildPath}/${binaryName}" "${archivePath}/code-server"
	cp "${rootPath}/README.md" "${archivePath}"
	cp "${sourcePath}/LICENSE.txt" "${archivePath}"
	cp "${sourcePath}/ThirdPartyNotices.txt" "${archivePath}"

	cd "${releasePath}"
	if [[ "${target}" == "darwin" ]] ; then
		zip -r "${binaryName}.zip" "${binaryName}"
		log "Archive: ${archivePath}.zip"
	else
		tar -czf "${binaryName}.tar.gz" "${binaryName}"
		log "Archive: ${archivePath}.tar.gz"
	fi
}

# Bundle built code into a binary.
function binary-task() {
	cd "${rootPath}"
	node "${rootPath}/scripts/nbin.js" "${buildPath}" "${target}" "${binaryName}"
	log "Binary: ${buildPath}/${binaryName}"
}

# Check if it looks like we are inside VS Code.
function in-vscode () {
	local dir="${1}" ; shift
	local maybeVsCode
	local dirName
	maybeVsCode="$(cd "${dir}/../../.." ; pwd -P)"
	dirName="$(basename "${maybeVsCode}")"
	if [[ "${dirName}" != "vscode" ]] ; then
		return 1
	fi
	if [[ ! -f "${maybeVsCode}/package.json" ]] ; then
		return 1
	fi
	if ! grep '"name": "code-oss-dev"' "${maybeVsCode}/package.json" -q ; then
		return 1
	fi
	return 0
}

function main() {
	local rootPath
	rootPath="$(cd "$(dirname "${0}")/.." ; pwd -P)"

	local task="${1}" ; shift
	if [[ "${task}" == "ensure-in-vscode" ]] ; then
		if ! in-vscode "${rootPath}"; then
			log "Not in VS Code" "error"
			exit 1
		fi
		exit 0
	fi

	# This lets you build in a separate directory since building within this
	# directory while developing makes it hard to keep developing since compiling
	# will compile everything in the build directory as well.
	local outPath="${OUT:-${rootPath}}"
	local releasePath="${outPath}/release"
	local stagingPath="${outPath}/build"

	# If we're inside a VS Code directory, assume we want to develop. In that case
	# we should set an OUT directory and not build in this directory.
	if in-vscode "${outPath}" ; then
		log "Set the OUT environment variable to something outside of VS Code" "error"
		exit 1
	fi

	local vscodeVersion="${1}" ; shift
	local sourceName="vscode-${vscodeVersion}-source"
	local sourcePath="${stagingPath}/${sourceName}"

	if [[ "${task}" == "package-prebuilt" ]] ; then
		local archiveName="vscode-${vscodeVersion}.tar.gz"
		cd "${sourcePath}"
		git reset --hard && git clean -xfd -e '.build/extensions' -e 'node_modules'
		cd "${stagingPath}"
		tar -czf "${archiveName}" "${sourceName}"
		mkdir -p "${releasePath}" && mv -f "${archiveName}" "${releasePath}"
		exit 0
	fi

	local codeServerVersion="${1}" ; shift
	local ci="${CI:-}"
	local minify="${MINIFY:-}"

	local arch
	arch=$(uname -m)

	local target="linux"
	local ostype="${OSTYPE:-}"
	if [[ "${ostype}" == "darwin"* ]] ; then
		target="darwin"
	else
		# On Alpine there seems no way to get the version except to use an invalid
		# command which will output the version to stderr and exit with 1.
		local output
		output=$(ldd --version 2>&1 || :)
		if [[ "${output}" == "musl"* ]] ; then
			target="alpine"
		fi
	fi

	local binaryName="code-server${codeServerVersion}-vsc${vscodeVersion}-${target}-${arch}"
	local buildPath="${stagingPath}/${binaryName}-built"

	"${task}-task" "$@"
}

main "$@"
