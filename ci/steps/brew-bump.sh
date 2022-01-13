#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."
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

  # NOTE: we need to make sure cdrci/homebrew-core
  # is up-to-date
  # otherwise, brew bump-formula-pr will use an
  # outdated base
  echo "Cloning cdrci/homebrew-core"
  git clone https://github.com/cdrci/homebrew-core.git

  # Make sure the git clone step is successful
  if directory_exists "homebrew-core"; then
    echo "git clone failed. Cannot find homebrew-core directory."
    ls -la
    exit 1
  fi

  echo "Changing into homebrew-core directory"
  pushd homebrew-core && pwd

  echo "Adding Homebrew/homebrew-core"
  git remote add upstream https://github.com/Homebrew/homebrew-core.git

  # Make sure the git remote step is successful
  if ! git config remote.upstream.url > /dev/null; then
    echo "git remote add upstream failed."
    echo "Could not find upstream in list of remotes."
    git remote -v
    exit 1
  fi

  # TODO@jsjoeio - can I somehow check that this succeeded?
  echo "Fetching upstream Homebrew/hombrew-core commits"
  git fetch upstream

  # TODO@jsjoeio - can I somehow check that this succeeded?
  echo "Merging in latest Homebrew/homebrew-core changes"
  git merge upstream/master

  echo "Pushing changes to cdrci/homebrew-core fork on GitHub"

  # GIT_ASKPASS lets us use the password when pushing without revealing it in the process list
  # See: https://serverfault.com/a/912788
  PATH_TO_GIT_ASKPASS="$HOME/git-askpass.sh"
  # Source: https://serverfault.com/a/912788
  # shellcheck disable=SC2016,SC2028
  echo 'echo $HOMEBREW_GITHUB_API_TOKEN' > "$PATH_TO_ASKPASS"

  # Make sure the git-askpass.sh file creation is successful
  if file_exists "$PATH_TO_GIT_ASKPASS"; then
    echo "git-askpass.sh not found in $HOME."
    ls -la "$HOME"
    exit 1
  fi

  # Ensure it's executable since we just created it
  chmod +x "$PATH_TO_GIT_ASKPASS"

  # Make sure the git-askpass.sh file is executable
  if is_executable "$PATH_TO_GIT_ASKPASS"; then
    echo "$PATH_TO_GIT_ASKPASS is not executable."
    ls -la "$PATH_TO_GIT_ASKPASS"
    exit 1
  fi

  # Export the variables so git sees them
  export HOMEBREW_GITHUB_API_TOKEN="$HOMEBREW_GITHUB_API_TOKEN"
  export GIT_ASKPASS="$PATH_TO_ASKPASS"
  git push https://cdr-oss@github.com/cdr-oss/homebrew-core.git --all

  # Find the docs for bump-formula-pr here
  # https://github.com/Homebrew/brew/blob/master/Library/Homebrew/dev-cmd/bump-formula-pr.rb#L18
  local output
  if ! output=$(brew bump-formula-pr --version="${VERSION}" code-server --no-browse --no-audit 2>&1); then
    if [[ $output == *"Duplicate PRs should not be opened"* ]]; then
      echo "$VERSION is already submitted"
    else
      echo "$output"
      exit 1
    fi
  fi

  # Clean up and remove homebrew-core
  popd
  rm -rf homebrew-core

  # Make sure homebrew-core is removed
  if directory_exists "homebrew-core"; then
    echo "rm -rf homebrew-core failed."
    ls -la
  fi
}

main "$@"
