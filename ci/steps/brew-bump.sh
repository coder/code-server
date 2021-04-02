#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."
  # Only sourcing this so we get access to $VERSION
  source ./ci/lib.sh
  # Find the docs for bump-formula-pr here
  # https://github.com/Homebrew/brew/blob/master/Library/Homebrew/dev-cmd/bump-formula-pr.rb#L18
  brew bump-formula-pr --force --version="${VERSION}" code-server --no-browse --no-audit
}

main "$@"
