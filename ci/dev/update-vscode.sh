#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  # Check if the remote exists
  # if it doesn't, we add it
  if ! git config remote.vscode.url > /dev/null; then
    echo "Could not find 'vscode' as a remote"
    echo "Adding with: git remote add -f vscode https://github.com/microsoft/vscode.git &> /dev/null"
    echo "Supressing output with '&> /dev/null'"
    git remote add -f vscode https://github.com/microsoft/vscode.git &> /dev/null
  fi

  # Ask which version we should update to
  # In the future, we'll automate this and grab the latest version automatically
  read -r -p "What version of VSCode would you like to update to? (i.e. 1.52) " VSCODE_VERSION_TO_UPDATE

  # Check that this version exists
  if [[ -z $(git ls-remote --heads vscode release/"$VSCODE_VERSION_TO_UPDATE") ]]; then
    echo "Oops, that doesn't look like a valid version."
    echo "You entered: $VSCODE_VERSION_TO_UPDATE"
    echo "Verify that this branches exists here: https://github.com/microsoft/vscode/branches/all?query=release%2F$VSCODE_VERSION_TO_UPDATE"
    exit 1
  fi

  echo -e "Great! We'll prep a PR for updating to $VSCODE_VERSION_TO_UPDATE\n"

  # Check if GitHub CLI is installed
  if ! command -v gh &> /dev/null; then
    echo "GitHub CLI could not be found."
    echo "If you install it before you run this script next time, we'll open a draft PR for you!"
    echo -e "See docs here: https://github.com/cli/cli#installation\n"
    exit
  fi

  # Push branch to remote if not already pushed
  # If we don't do this, the opening a draft PR step won't work
  # because it will stop and ask where you want to push the branch
  CURRENT_BRANCH=$(git branch --show-current)
  if [[ -z $(git ls-remote --heads origin "$CURRENT_BRANCH") ]]; then
    echo "Doesn't look like you've pushed this branch to remote"
    echo -e "Pushing now using: git push origin $CURRENT_BRANCH\n"
    git push origin "$CURRENT_BRANCH"
  fi

  echo "Opening a draft PR on GitHub"
  # To read about these flags, visit the docs: https://cli.github.com/manual/gh_pr_create
  gh pr create --base master --title "feat(vscode): update to version $VSCODE_VERSION_TO_UPDATE" --body "This PR updates vscode to version: $VSCODE_VERSION_TO_UPDATE" --reviewer @cdr/code-server-reviewers --repo cdr/code-server --draft

  echo "Going to try to update vscode for you..."
  echo -e "Running: git subtree pull --prefix lib/vscode vscode release/${VSCODE_VERSION_TO_UPDATE} --squash\n"
  # Try to run subtree update command
  git subtree pull --prefix lib/vscode vscode release/"${VSCODE_VERSION_TO_UPDATE}" --squash --message "chore(vscode): update to $VSCODE_VERSION_TO_UPDATE"
}

main "$@"
