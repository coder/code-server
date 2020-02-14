#!/usr/bin/env bash

set -euo pipefail

main() {
  shfmt -i 2 -w -s -sr $$(git ls-files "*.sh")
  prettier --write --loglevel=warn $$(git ls-files "*.js" "*.ts" "*.tsx" "*.html" "*.json" "*.css" "*.md" "*.toml" "*.yaml" "*.yml")
	if [[ "$CI" != "" && $$(git ls-files --other --modified --exclude-standard) != "" ]]; then
	  echo "Files need generation or are formatted incorrectly:"
	  git -c color.ui=always status | grep --color=no '\[31m'
	  echo "Please run the following locally:"
	  echo "  make fmt"
	  exit 1
	fi
}

main "$@"
