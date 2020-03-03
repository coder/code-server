#!/usr/bin/env bash

set -euo pipefail

main() {
  eslint --max-warnings=0 --fix $(git ls-files "*.ts" "*.tsx" "*.js")
  stylelint $(git ls-files "*.css")
  tsc --noEmit
}

main "$@"
