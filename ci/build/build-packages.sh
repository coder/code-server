#!/usr/bin/env bash
set -euo pipefail

# Packages code-server for the current OS and architecture into ./release-packages.
# This script assumes that a static release is built already into ./release-static.

main() {
  cd "$(dirname "${0}")/../.."
  source ./ci/lib.sh

  mkdir -p release-packages

  release_archive
  if [[ $OS == linux && $ARCH == "amd64" ]]; then
    # Will stop most of the auto update issues.
    # For the other releases it's more important to not pollute the release listing.
    ARCH=x86_64 release_archive
  fi

  if [[ $OSTYPE == linux* ]]; then
    release_nfpm
  fi
}

release_archive() {
  local release_name="code-server-$VERSION-$OS-$ARCH"
  if [[ $OS == "linux" ]]; then
    tar -czf "release-packages/$release_name.tar.gz" --transform "s/^\.\/release-static/$release_name/" ./release-static
  else
    tar -czf "release-packages/$release_name.tar.gz" -s "/^release-static/$release_name/" release-static
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
  nfpm_config=$(envsubst < ./ci/build/nfpm.yaml)

  # The underscores are convention for .deb.
  nfpm pkg -f <(echo "$nfpm_config") --target "release-packages/code-server_${VERSION}_$ARCH.deb"
  nfpm pkg -f <(echo "$nfpm_config") --target "release-packages/code-server-$VERSION-$ARCH.rpm"
}

main "$@"
