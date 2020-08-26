#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "${0}")/../.."
  source ./ci/lib.sh

  rm -rf \
    out \
    release \
    release-standalone \
    release-packages \
    release-gcp \
    release-images \
    dist \
    .cache \
    node-*

  pushd lib/vscode
  git clean -xffd
  git reset --hard
  popd
}

main "$@"
