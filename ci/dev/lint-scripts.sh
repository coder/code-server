#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."
  shellcheck -e SC2046,SC2164,SC2154,SC1091,SC1090,SC2002 $(git ls-files '*.sh' | grep -v 'lib/vscode')
}

main "$@"
