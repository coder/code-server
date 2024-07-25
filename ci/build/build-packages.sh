#!/usr/bin/env bash
set -euo pipefail

# Packages code-server for the current OS and architecture into ./release-packages.
# This script assumes that a standalone release is built already into ./release-standalone

main() {
  cd "$(dirname "${0}")/../.."
  source ./ci/lib.sh
  source ./ci/build/build-lib.sh

  # Allow us to override architecture
  # we use this for our Linux ARM64 cross compile builds
  if [ "$#" -eq 1 ] && [ "$1" ]; then
    ARCH=$1
  fi

  mkdir -p release-packages

  release_archive

  if [[ $OS == "linux" ]]; then
    release_nfpm
  fi
}

release_archive() {
  local release_name="code-server-$VERSION-$OS-$ARCH"
  if [[ $OS == "linux" ]]; then
    tar -czf "release-packages/$release_name.tar.gz" --owner=0 --group=0 --transform "s/^\.\/release-standalone/$release_name/" ./release-standalone
  else
    tar -czf "release-packages/$release_name.tar.gz" -s "/^release-standalone/$release_name/" release-standalone
  fi

  echo "done (release-packages/$release_name)"

  release_gcp
}

release_gcp() {
  mkdir -p "release-gcp/$VERSION"
  cp "release-packages/$release_name.tar.gz" "./release-gcp/$VERSION/$OS-$ARCH.tar.gz"
  mkdir -p "release-gcp/latest"
  cp "./release-packages/$release_name.tar.gz" "./release-gcp/latest/$OS-$ARCH.tar.gz"
}

# Generates deb and rpm packages.
release_nfpm() {
  local nfpm_config

  export NFPM_ARCH

  PKG_FORMAT="deb"
  NFPM_ARCH="$(get_nfpm_arch $PKG_FORMAT "$ARCH")"
  nfpm_config="$(envsubst < ./ci/build/nfpm.yaml)"
  echo "Building deb"
  echo "$nfpm_config" | head --lines=4
  nfpm pkg -f <(echo "$nfpm_config") --target "release-packages/code-server_${VERSION}_${NFPM_ARCH}.deb"

  PKG_FORMAT="rpm"
  NFPM_ARCH="$(get_nfpm_arch $PKG_FORMAT "$ARCH")"
  nfpm_config="$(envsubst < ./ci/build/nfpm.yaml)"
  echo "Building rpm"
  echo "$nfpm_config" | head --lines=4
  nfpm pkg -f <(echo "$nfpm_config") --target "release-packages/code-server-$VERSION-$NFPM_ARCH.rpm"
}

main "$@"
