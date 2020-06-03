#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."
  source ./ci/lib.sh

  ./ci/release-image/build.sh

  mkdir -p release-images
  docker save "codercom/code-server-$ARCH:$VERSION" > "release-images/code-server-$ARCH-$VERSION.tar"
}

main "$@"
