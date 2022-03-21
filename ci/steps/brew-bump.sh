#!/usr/bin/env bash
set -euo pipefail

main() {
  REPO="homebrew-core"
  GITHUB_USERNAME="cdrci"
  UPSTREAM_USERNAME_AND_REPO="Homebrew/$REPO"
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

  # Make sure the git clone step is successful
  if ! directory_exists "$REPO"; then
    echo "git clone failed. Cannot find $REPO directory."
    ls -la
    exit 1
  fi

  echo "Changing into $REPO directory"
  pushd "$REPO" && pwd

  echo "Adding $UPSTREAM_USERNAME_AND_REPO"
  git remote add upstream "https://github.com/$UPSTREAM_USERNAME_AND_REPO.git"

  # Make sure the git remote step is successful
  if ! git config remote.upstream.url > /dev/null; then
    echo "git remote add upstream failed."
    echo "Could not find upstream in list of remotes."
    git remote -v
    exit 1
  fi

  # TODO@jsjoeio - can I somehow check that this succeeded?
  echo "Fetching upstream $UPSTREAM_USERNAME_AND_REPO commits"
  git fetch upstream master

  # TODO@jsjoeio - can I somehow check that this succeeded?
  echo "Merging in latest $UPSTREAM_USERNAME_AND_REPO changes branch master"
  git merge upstream/master

  # GIT_ASKPASS lets us use the password when pushing without revealing it in the process list
  # See: https://serverfault.com/a/912788
  PATH_TO_GIT_ASKPASS="$HOME/git-askpass.sh"
  # Source: https://serverfault.com/a/912788
  # shellcheck disable=SC2016,SC2028
  echo 'echo $HOMEBREW_GITHUB_API_TOKEN' > "$PATH_TO_GIT_ASKPASS"

  # Make sure the git-askpass.sh file creation is successful
  if ! file_exists "$PATH_TO_GIT_ASKPASS"; then
    echo "git-askpass.sh not found in $HOME."
    ls -la "$HOME"
    exit 1
  fi

  # Ensure it's executable since we just created it
  chmod +x "$PATH_TO_GIT_ASKPASS"

  # Make sure the git-askpass.sh file is executable
  if ! is_executable "$PATH_TO_GIT_ASKPASS"; then
    echo "$PATH_TO_GIT_ASKPASS is not executable."
    ls -la "$PATH_TO_GIT_ASKPASS"
    exit 1
  fi

  # NOTE: we need to make sure our fork is up-to-date
  # otherwise, brew bump-formula-pr will use an
  # outdated base
  echo "Pushing changes to $GITHUB_USERNAME/$REPO fork on GitHub"
  # Export the variables so git sees them
  export HOMEBREW_GITHUB_API_TOKEN="$HOMEBREW_GITHUB_API_TOKEN"
  export GIT_ASKPASS="$PATH_TO_GIT_ASKPASS"
  git push "https://$GITHUB_USERNAME@github.com/$GITHUB_USERNAME/$REPO.git" --all

  # Find the docs for bump-formula-pr here
  # https://github.com/Homebrew/brew/blob/master/Library/Homebrew/dev-cmd/bump-formula-pr.rb#L18
  local output
  if ! output=$(brew bump-formula-pr --version="${VERSION}" code-server --no-browse --no-audit 2>&1); then
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
