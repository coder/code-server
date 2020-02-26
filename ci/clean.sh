#!/usr/bin/env bash

set -euo pipefail

main() {
  git clean -Xffd
  git submodule foreach --recursive git clean -xffd
  git submodule foreach --recursive git reset --hard
}

main "$@"
