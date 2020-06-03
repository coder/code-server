#!/usr/bin/env bash
set -euo pipefail

# Packages code-server for the current OS and architecture into ./release-packages.
# This script assumes that a standalone release is built already into ./release-standalone

main() {
  cd "$(dirname "${0}")/../.."
  source ./ci/lib.sh

  mkdir -p release-packages

  release_archive
  # Will stop the auto update issues and allow people to upgrade their scripts
  # for the new release structure.
  if [[ $ARCH == "amd64" ]]; then
    if [[ $OS == "linux" ]]; then
      ARCH=x86_64 release_archive
    elif [[ $OS == "macos" ]]; then
      OS=darwin ARCH=x86_64 release_archive
    fi
  fi

  if [[ $OS == "linux" ]]; then
    release_nfpm
  fi
}

release_archive() {
  local release_name="code-server-$VERSION-$OS-$ARCH"
  if [[ $OS == "linux" ]]; then
    tar -czf "release-packages/$release_name.tar.gz" --transform "s/^\.\/release-standalone/$release_name/" ./release-standalone
  elif [[ $OS == "macos" && $ARCH == "x86_64" ]]; then
    # Just exists to make autoupdating from 3.2.0 work again.
    mv ./release-standalone "./$release_name"
    zip -r "release-packages/$release_name.zip" "./$release_name"
    mv "./$release_name" ./release-standalone
    return
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
  nfpm_config="$(envsubst < ./ci/build/nfpm.yaml)"

  # The underscores are convention for .deb.
  nfpm pkg -f <(echo "$nfpm_config") --target "release-packages/code-server_${VERSION}_$ARCH.deb"
  nfpm pkg -f <(echo "$nfpm_config") --target "release-packages/code-server-$VERSION-$ARCH.rpm"
}

main "$@"
