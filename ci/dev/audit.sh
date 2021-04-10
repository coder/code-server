#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  # Prevents integration with moderate or higher vulnerabilities
  # Docs: https://github.com/IBM/audit-ci#options
  yarn audit-ci --moderate
}

main "$@"
