#!/usr/bin/env bash
set -euo pipefail

# Creates a draft release with the template for the version in package.json

main() {
  cd "$(dirname "$0")/../.."
  source ./ci/lib.sh

  gh release create "v$VERSION" \
    --notes-file - \
    --target "$(git rev-parse HEAD)" \
    --draft << EOF
v$VERSION

VS Code v$(vscode_version)

Upgrading is as easy as installing the new version over the old one. code-server
maintains all user data in \`~/.local/share/code-server\` so that it is preserved in between
installations.

## New Features

⭐ Summarize new features here with references to issues

  - item

## Bug Fixes

⭐ Summarize bug fixes here with references to issues

  - item

## Documentation

⭐ Summarize doc changes here with references to issues

  - item

## Development

⭐ Summarize development/testing changes here with references to issues

  - item

Cheers! 🍻
EOF
}

main "$@"
