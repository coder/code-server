#!/usr/bin/env bash
set -euo pipefail

# Given a release found in $RELEASE_PATH, generate a deb, rpm, and tarball each
# named after $ARCH (derived from uname -m but can be overridden for
# cross-compilation) and $OS (derived from uname and cannot be overridden) and
# place them in ./release-packages and ./release-gcp.

main() {
  cd "$(dirname "${0}")/../.."
  source ./ci/lib.sh
  source ./ci/build/build-lib.sh

  VERSION=$(jq -r .version "$RELEASE_PATH/package.json")
  export VERSION # for nfpm to use

  mkdir -p release-packages

  release_archive

  if [[ $OS == "linux" ]]; then
    release_nfpm
  fi
}

release_archive() {
  local release_name="code-server-$VERSION-$OS-$ARCH"
  if [[ $OS == "linux" ]]; then
    tar -czf "release-packages/$release_name.tar.gz" --owner=0 --group=0 --transform "s/^\.\/$RELEASE_PATH/$release_name/" "$RELEASE_PATH"
  else
    tar -czf "release-packages/$release_name.tar.gz" -s "/^$RELEASE_PATH/$release_name/" "$RELEASE_PATH"
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

  NFPM_ARCH="$(get_nfpm_arch deb "$ARCH")"
  nfpm_config="$(envsubst < ./ci/build/nfpm.yaml)"
  echo "Building deb"
  echo "$nfpm_config" | head --lines=4
  nfpm pkg -f <(echo "$nfpm_config") --target "release-packages/code-server_${VERSION}_${NFPM_ARCH}.deb"

  NFPM_ARCH="$(get_nfpm_arch rpm "$ARCH")"
  nfpm_config="$(envsubst < ./ci/build/nfpm.yaml)"
  echo "Building rpm"
  echo "$nfpm_config" | head --lines=4
  nfpm pkg -f <(echo "$nfpm_config") --target "release-packages/code-server-$VERSION-$NFPM_ARCH.rpm"
}

main "$@"
