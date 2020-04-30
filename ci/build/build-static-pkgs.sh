#!/usr/bin/env bash
set -euo pipefail

# Generates deb and rpm packages for CI.
# Assumes a static release has already been built.

main() {
  cd "$(dirname "${0}")/../.."
  source ./ci/lib.sh

  VERSION="$(pkg_json_version)"
  export VERSION

  ARCH="$(arch)"
  export ARCH

  local nfpm_config
  nfpm_config=$(envsubst < ./ci/build/nfpm.yaml)

  nfpm pkg -f <(echo "$nfpm_config") --target release-github/code-server-"$VERSION-$ARCH.deb"
  nfpm pkg -f <(echo "$nfpm_config") --target release-github/code-server-"$VERSION-$ARCH.rpm"
}

main "$@"
