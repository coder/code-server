#!/usr/bin/env bash

set -euo pipefail

main() {
  eslint --max-warnings=0 --fix $$(git ls-files "*.ts" "*.tsx" "*.js")
  stylelint --fix $$(git ls-files "*.css")
}

main "$@"
