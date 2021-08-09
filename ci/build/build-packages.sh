#!/usr/bin/env bash
set -euo pipefail

# Packages code-server for the current OS and architecture into ./release-packages.
# This script assumes that a standalone release is built already into ./release-standalone

main() {
  cd "$(dirname "${0}")/../.."
  source ./ci/lib.sh

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
    tar -czf "release-packages/$release_name.tar.gz" --transform "s/^\.\/release-standalone/$release_name/" ./release-standalone
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

# On some CPU architectures (notably node/uname "armv7l", default on Raspberry Pis),
# different package managers have different labels for the same CPU (deb=armhf, rpm=armhfp).
# This function parses arch-override.json and returns the overriden arch on platforms
# with alternate labels, or the same arch otherwise.
get_nfpm_arch() {
  if jq -re ".${PKG_FORMAT}.${ARCH}" ./ci/build/arch-override.json > /dev/null; then
    jq -re ".${PKG_FORMAT}.${ARCH}" ./ci/build/arch-override.json
  else
    echo "$ARCH"
  fi
}

# Generates deb and rpm packages.
release_nfpm() {
  local nfpm_config

  PKG_FORMAT="deb"
  NFPM_ARCH="$(get_nfpm_arch)"
  nfpm_config="$(envsubst < ./ci/build/nfpm.yaml)"
  nfpm pkg -f <(echo "$nfpm_config") --target "release-packages/code-server_${VERSION}_${NFPM_ARCH}.deb"

  PKG_FORMAT="rpm"
  NFPM_ARCH="$(get_nfpm_arch)"
  nfpm_config="$(envsubst < ./ci/build/nfpm.yaml)"
  nfpm pkg -f <(echo "$nfpm_config") --target "release-packages/code-server-$VERSION-$NFPM_ARCH.rpm"
}

main "$@"
