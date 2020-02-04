#!/usr/bin/env sh
# lint.sh -- Lint CSS and JS files.

set -eu

main() {
  yarn lint:css "$@"
  yarn lint:js "$@"
}

main "$@"
