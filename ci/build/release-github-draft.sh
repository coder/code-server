#!/usr/bin/env bash
set -euo pipefail

# Creates a draft release with the template for the version in package.json

main() {
  cd "$(dirname "$0")/../.."
  source ./ci/lib.sh

  hub release create \
    --file - \
    -t "$(git rev-parse HEAD)" \
    --draft "v$VERSION" << EOF
v$VERSION

VS Code v$(vscode_version)

Upgrading is as easy as installing the new version over the old one. code-server
maintains all user data in \`~/.local/share/code-server\` so that it is preserved in between
installations.

## New Features

  - ⭐ Summarize new features here with references to issues

## VS Code
  - ⭐ Summarize VS Code version update here with references to issues

## Bug Fixes
  - ⭐ Summarize bug fixes here with references to issues

## Documentation
  - ⭐ Summarize doc changes here with references to issues

## Development
  - ⭐ Summarize development/testing changes here with references to issues


Cheers! 🍻
EOF
}

main "$@"
