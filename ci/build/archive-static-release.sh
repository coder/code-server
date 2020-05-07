#!/usr/bin/env bash
set -euo pipefail

# Generates static code-server releases for CI.
# This script assumes that a static release is built already.

main() {
  cd "$(dirname "${0}")/../.."
  source ./ci/lib.sh

  VERSION="$(pkg_json_version)"

  local OS
  OS="$(os)"

  local ARCH
  ARCH="$(arch)"

  local archive_name="code-server-$VERSION-$OS-$ARCH"
  mkdir -p release-github

  local ext
  if [[ $OS == "linux" ]]; then
    ext=".tar.gz"
    tar -czf "release-github/$archive_name$ext" --transform "s/^\.\/release-static/$archive_name/" ./release-static
  else
    mv ./release-static "./$archive_name"
    ext=".zip"
    zip -r "release-github/$archive_name$ext" "./$archive_name"
    mv "./$archive_name" ./release-static
  fi

  echo "done (release-github/$archive_name)"

  mkdir -p "release-gcp/$VERSION"
  cp "release-github/$archive_name$ext" "./release-gcp/$VERSION/$OS-$ARCH$ext"
  mkdir -p "release-gcp/latest"
  cp "./release-github/$archive_name$ext" "./release-gcp/latest/$OS-$ARCH$ext"
}

main "$@"
