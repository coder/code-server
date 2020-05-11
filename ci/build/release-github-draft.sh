#!/usr/bin/env bash
set -euo pipefail

# Creates a draft release with the template for the version in package.json

main() {
  cd "$(dirname "$0")/../.."
  source ./ci/lib.sh

  hub release create \
    --file - \
    --draft "${assets[@]}" "v$(pkg_json_version)" << EOF
v$(pkg_json_version)

VS Code v$(vscode_version)

- Summarize changes here with references to issues
EOF
}

main "$@"
