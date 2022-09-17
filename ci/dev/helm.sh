#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  if command -v helm && helm kubeval --help > /dev/null; then
    helm kubeval ci/helm-chart
  fi

  cd "$OLDPWD"
}

main "$@"
