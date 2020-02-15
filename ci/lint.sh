#!/usr/bin/env bash

set -euo pipefail

main() {
  if [[ ${CI-} ]]; then
    cd "$(dirname "$0")/.."
    ./ci/vscode.sh
  fi

  eslint --max-warnings=0 --fix $(git ls-files "*.ts" "*.tsx" "*.js")
  stylelint --fix $(git ls-files "*.css")
  tsc --noEmit
}

main "$@"
