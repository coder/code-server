#!/usr/bin/env bash
set -euo pipefail

main() {
  # Only sourcing this so we get access to $VERSION
  source ./ci/lib.sh
  source ./ci/steps/steps-lib.sh

  echo "Checking environment variables"

  # We need VERSION to bump the brew formula
  if ! is_env_var_set "VERSION"; then
    echo "VERSION is not set"
    exit 1
  fi

  # We need HOMEBREW_GITHUB_API_TOKEN to push up commits
  if ! is_env_var_set "HOMEBREW_GITHUB_API_TOKEN"; then
    echo "HOMEBREW_GITHUB_API_TOKEN is not set"
    exit 1
  fi

  # Find the docs for bump-formula-pr here
  # https://github.com/Homebrew/brew/blob/master/Library/Homebrew/dev-cmd/bump-formula-pr.rb#L18
  local output
  if ! output=$(brew bump-formula-pr --version="${VERSION}" code-server --no-browse --no-audit --message="PR opened by @${GITHUB_ACTOR}" 2>&1); then
    if [[ $output == *"Duplicate PRs should not be opened"* ]]; then
      echo "$VERSION is already submitted"
      exit 0
    else
      echo "$output"
      exit 1
    fi
  fi
}

main "$@"
