#!/usr/bin/env bash
set -euo pipefail

set_version() {
  local code_server_version=${VERSION:-${TRAVIS_TAG:-}}
  if [[ -z $code_server_version ]]; then
    code_server_version=$(grep version ./package.json | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d '[:space:]')
  fi
  export VERSION=$code_server_version
}
