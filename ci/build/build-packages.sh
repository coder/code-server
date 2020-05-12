#!/usr/bin/env bash
set -euo pipefail

# Packages code-server for the current OS and architecture into ./release-packages.
# This script assumes that a static release is built already into ./release-static.

main() {
  cd "$(dirname "${0}")/../.."
  source ./ci/lib.sh

  export VERSION
  VERSION="$(pkg_json_version)"

  local OS
  OS="$(os)"

  export ARCH
  ARCH="$(arch)"

  local archive_name="code-server-$VERSION-$OS-$ARCH"
  mkdir -p release-packages

  local ext
  if [[ $OS == "linux" ]]; then
    ext=".tar.gz"
    tar -czf "release-packages/$archive_name$ext" --transform "s/^\.\/release-static/$archive_name/" ./release-static
  else
    mv ./release-static "./$archive_name"
    ext=".zip"
    zip -r "release-packages/$archive_name$ext" "./$archive_name"
    mv "./$archive_name" ./release-static
  fi

  echo "done (release-packages/$archive_name)"

  release_gcp

  if [[ $OSTYPE == linux* ]]; then
    release_nfpm
  fi
}

release_gcp() {
  mkdir -p "release-gcp/$VERSION"
  cp "release-packages/$archive_name$ext" "./release-gcp/$VERSION/$OS-$ARCH$ext"
  mkdir -p "release-gcp/latest"
  cp "./release-packages/$archive_name$ext" "./release-gcp/latest/$OS-$ARCH$ext"
}

# Generates deb and rpm packages.
release_nfpm() {
  local nfpm_config
  nfpm_config=$(envsubst < ./ci/build/nfpm.yaml)

  # The underscores are convention for .deb.
  nfpm pkg -f <(echo "$nfpm_config") --target release-packages/code-server_"$VERSION_$ARCH.deb"
  nfpm pkg -f <(echo "$nfpm_config") --target release-packages/code-server-"$VERSION-$ARCH.rpm"
}

main "$@"
