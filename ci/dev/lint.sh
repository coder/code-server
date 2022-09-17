#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  tsc --noEmit --skipLibCheck

  cd "$OLDPWD"
}

main "$@"
