#!/usr/bin/env bash
# ci.bash -- Build code-server in the CI.

set -euo pipefail

function package() {
  local target
  target=$(uname | tr '[:upper:]' '[:lower:]')
  if [[ $target == "linux" ]]; then
    # Alpine's ldd doesn't have a version flag but if you use an invalid flag
    # (like --version) it outputs the version to stderr and exits with 1.
    local ldd_output
    ldd_output=$(ldd --version 2>&1 || true)
    if echo "$ldd_output" | grep -iq musl; then
      target="alpine"
    fi
  fi

  local arch
  arch=$(uname -m | sed 's/aarch/arm/')

  echo -n "Creating release..."

  cp "$(command -v node)" ./build
  cp README.md ./build
  cp LICENSE.txt ./build
  cp ./lib/vscode/ThirdPartyNotices.txt ./build
  cp ./ci/code-server.sh ./build/code-server

  local archive_name="code-server-$VERSION-$target-$arch"
  mkdir -p ./release

  local ext
  if [[ $target == "linux" ]]; then
    ext=".tar.gz"
    tar -czf "release/$archive_name$ext" --transform "s/^\.\/build/$archive_name/" ./build
  else
    mv ./build "./$archive_name"
    ext=".zip"
    zip -r "release/$archive_name$ext" "./$archive_name"
    mv "./$archive_name" ./build
  fi

  echo "done (release/$archive_name)"

  # release-upload is for uploading to the GCP bucket whereas release is used for GitHub.
  mkdir -p "./release-upload/$VERSION"
  cp "./release/$archive_name$ext" "./release-upload/$VERSION/$target-$arch$ext"
  mkdir -p "./release-upload/latest"
  cp "./release/$archive_name$ext" "./release-upload/latest/$target-$arch$ext"
}

# This script assumes that yarn has already ran.
function build() {
  # Always minify and package on CI.
  if [[ ${CI:-} ]]; then
    export MINIFY="true"
  fi

  yarn build
}

function main() {
  cd "$(dirname "${0}")/.."
  source ./ci/lib.sh

  set_version

  build

  if [[ ${CI:-} ]]; then
    package
  fi
}

main "$@"
