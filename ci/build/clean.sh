#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "${0}")/../.."
  source ./ci/lib.sh

  rm -Rf \
    out \
    release \
    release-static \
    release-packages \
    release-gcp \
    dist \
    .tsbuildinfo \
    .cache/out.tsbuildinfo

  pushd lib/vscode
  git clean -xffd
  git reset --hard
  popd
}

main "$@"
