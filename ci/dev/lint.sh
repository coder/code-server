#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  eslint --max-warnings=0 --fix $(git ls-files "*.ts" "*.tsx" "*.js" | grep -v "lib/vscode")
  stylelint $(git ls-files "*.css" | grep -v "lib/vscode")
  tsc --noEmit --skipLibCheck
  shellcheck -e SC2046,SC2164,SC2154,SC1091,SC1090,SC2002 $(git ls-files "*.sh" | grep -v "lib/vscode")
  if command -v helm && helm kubeval --help > /dev/null; then
    helm kubeval ci/helm-chart
  fi

  cd "$OLDPWD"
}

main "$@"
