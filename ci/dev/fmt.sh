#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  shfmt -i 2 -w -s -sr $(git ls-files "*.sh")

  local prettierExts
  prettierExts=(
    "*.js"
    "*.ts"
    "*.tsx"
    "*.html"
    "*.json"
    "*.css"
    "*.md"
    "*.toml"
    "*.yaml"
    "*.yml"
  )
  prettier --write --loglevel=warn $(git ls-files "${prettierExts[@]}")

  if [[ ${CI-} && $(git ls-files --other --modified --exclude-standard) ]]; then
    echo "Files need generation or are formatted incorrectly:"
    git -c color.ui=always status | grep --color=no '\[31m'
    echo "Please run the following locally:"
    echo "  yarn fmt"
    exit 1
  fi
}

main "$@"
