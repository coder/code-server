#!/usr/bin/env bash
set -euo pipefail

main() {
  echo 'Installing VS Code dependencies...'
  cd modules/code-oss-dev
  yarn install --frozen-lockfile
}

main "$@"
