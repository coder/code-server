#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  eslint --max-warnings=0 --fix $(git ls-files "*.ts" "*.tsx" "*.js" | grep -v "lib/vscode")
  tsc --noEmit --skipLibCheck
  if command -v helm && helm kubeval --help > /dev/null; then
    helm kubeval ci/helm-chart
  fi

  cd "$OLDPWD"
}

main "$@"
