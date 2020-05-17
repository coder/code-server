#!/usr/bin/env bash
set -euo pipefail

# Packages code-server for the current OS and architecture into ./release-packages.
# This script assumes that a static release is built already into ./release-static.

main() {
  cd "$(dirname "${0}")/../.."
  source ./ci/lib.sh

  local release_name="code-server-$VERSION-$OS-$ARCH"
  mkdir -p release-packages

  if [[ $OS == "linux" ]]; then
    tar -czf "release-packages/$release_name.tar.gz" --transform "s/^\.\/release-static/$release_name/" ./release-static
  else
    tar -czf "release-packages/$release_name.tar.gz" -s "/^release-static/$release_name/" release-static
  fi

  echo "done (release-packages/$release_name)"

  release_gcp

  if [[ $OSTYPE == linux* ]]; then
    release_nfpm
  fi
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
  nfpm pkg -f <(echo "$nfpm_config") --target "release-packages/code-server_${VERSION}_${ARCH}.deb"
  nfpm pkg -f <(echo "$nfpm_config") --target "release-packages/code-server-$VERSION-$ARCH.rpm"
}

main "$@"
