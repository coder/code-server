#!/usr/bin/env bash
set -euo pipefail

# Creates a draft release with the template for the version in package.json

main() {
  cd "$(dirname "$0")/../.."
  source ./ci/lib.sh

  hub release create \
    --file - \
    -t "$(git rev-parse HEAD)" \
    --draft "${assets[@]}" "v$VERSION" << EOF
v$VERSION

VS Code v$(vscode_version)

# New Features
  - ⭐ Summarize new features here with references to issues

## Bug Fixes
  - ⭐ Summarize bug fixes here with references to issues

Cheers! 🍻
EOF
}

main "$@"
