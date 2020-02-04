#!/usr/bin/env bash
# ci.bash -- Build code-server in the CI.

set -euo pipefail

function main() {
  cd "$(dirname "${0}")/.."

  local code_server_version=${VERSION:-${TRAVIS_TAG:-${DRONE_TAG:-}}}
  if [[ -z $code_server_version ]] ; then
    code_server_version=$(grep version ./package.json | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d '[:space:]')
  fi
  export VERSION=$code_server_version

  YARN_CACHE_FOLDER="$(pwd)/yarn-cache"
  export YARN_CACHE_FOLDER

  # Always minify and package on tags since that's when releases are pushed.
  if [[ -n ${DRONE_TAG:-} || -n ${TRAVIS_TAG:-} ]] ; then
    export MINIFY="true"
    export PACKAGE="true"
  fi

  if [[ -z ${SKIP_YARN:-} ]] ; then
    yarn
  fi

  yarn build
  yarn binary
  if [[ -n ${PACKAGE:-} ]] ; then
    yarn package
  fi

  cd binaries

  if [[ -n ${STRIP_BIN_TARGET:-} ]] ; then
    # In this case provide plainly named binaries.
    for binary in code-server* ; do
      echo "Moving $binary to code-server"
      mv "$binary" code-server
    done
  elif [[ -n ${DRONE_TAG:-} || -n ${TRAVIS_TAG:-} ]] ; then
    # Prepare directory for uploading binaries on release.
    for binary in code-server* ; do
      mkdir -p "../binary-upload"

      local prefix="code-server-$code_server_version-"
      local target="${binary#$prefix}"
      if [[ $target == "linux-x86_64" ]] ; then
        echo "Copying $binary to ../binary-upload/latest-linux"
        cp "$binary" "../binary-upload/latest-linux"
      fi

      local gcp_dir
      gcp_dir="../binary-upload/releases/$code_server_version/$target"
      mkdir -p "$gcp_dir"

      echo "Copying $binary to $gcp_dir/code-server"
      cp "$binary" "$gcp_dir/code-server"
    done
  fi
}

main "$@"
