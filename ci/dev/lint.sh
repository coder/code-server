#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  eslint --max-warnings=0 --fix $(git ls-files "*.ts" "*.tsx" "*.js" | grep -v "lib/vscode")
  tsc --noEmit --skipLibCheck

  cd "$OLDPWD"
}

main "$@"
