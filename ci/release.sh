#!/usr/bin/env bash
# ci.bash -- Build code-server in the CI.

set -euo pipefail

# This script assumes that yarn has already ran.
function main() {
  cd "$(dirname "${0}")/.."
  source ./ci/lib.sh

  set_version

  # Always minify and package on CI since that's when releases are pushed.
  if [[ ${CI:-} ]]; then
    export MINIFY="true"
    export PACKAGE="true"
  fi

  yarn build
  yarn binary
  if [[ -n ${PACKAGE:-} ]]; then
    yarn package
  fi

  cd binaries

  if [[ -n ${STRIP_BIN_TARGET:-} ]]; then
    # In this case provide plainly named binaries.
    for binary in code-server*; do
      echo "Moving $binary to code-server"
      mv "$binary" code-server
    done
  elif [[ -n ${DRONE_TAG:-} || -n ${TRAVIS_TAG:-} ]]; then
    # Prepare directory for uploading binaries on release.
    for binary in code-server*; do
      mkdir -p "../binary-upload"

      local prefix="code-server-$VERSION-"
      local target="${binary#$prefix}"
      if [[ $target == "linux-x86_64" ]]; then
        echo "Copying $binary to ../binary-upload/latest-linux"
        cp "$binary" "../binary-upload/latest-linux"
      fi

      local gcp_dir
      gcp_dir="../binary-upload/releases/$VERSION/$target"
      mkdir -p "$gcp_dir"

      echo "Copying $binary to $gcp_dir/code-server"
      cp "$binary" "$gcp_dir/code-server"
    done
  fi
}

main "$@"
