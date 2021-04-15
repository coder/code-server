#!/usr/bin/env bash
# Description: This is a script to make the process of updating vscode versions easier
# Run it with `yarn update:vscode` and it will do the following:
# 1. Check that you have a remote called `vscode`
# 2. Ask you which version you want to upgrade to
# 3. Grab the exact version from the package.json i.e. 1.53.2
# 4. Fetch the vscode remote branches to run the subtree update
# 5. Run the subtree update and pull in the vscode update
# 6. Commit the changes (including merge conflicts)
# 7. Open a draft PR

set -euo pipefail

# This function expects two arguments
# 1. the vscode version we're updating to
# 2. the list of merge conflict files
make_pr_body() {
  local BODY="This PR updates vscode to $1

## TODOS

- [ ] test editor locally
- [ ] test terminal locally
- [ ] make notes about any significant changes in docs/CONTRIBUTING.md#notes-about-changes

## Files with conflicts (fix these)
$2"
  echo "$BODY"
}

main() {
  cd "$(dirname "$0")/../.."

  # Check if the remote exists
  # if it doesn't, we add it
  if ! git config remote.vscode.url >/dev/null; then
    echo "Could not find 'vscode' as a remote"
    echo "Adding with: git remote add vscode https://github.com/microsoft/vscode.git"
    git remote add vscode https://github.com/microsoft/vscode.git
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

  # Check that they have jq installed
  if ! command -v jq &>/dev/null; then
    echo "jq could not be found."
    echo "We use this when looking up the exact version to update to in the package.json in VS Code."
    echo -e "See docs here: https://stedolan.github.io/jq/download/"
    exit 1
  fi

  # Note: `git subtree` returns 129 when installed, and prints help;
  # but when uninstalled, returns 1.
  set +e
  git subtree &>/dev/null
  if [ $? -ne 129 ]; then
    echo "git-subtree could not be found."
    echo "We use this to fetch and update the lib/vscode subtree."
    echo -e "Please install git subtree."
    exit 1
  fi
  set -e

  # Grab the exact version from package.json
  VSCODE_EXACT_VERSION=$(curl -s "https://raw.githubusercontent.com/microsoft/vscode/release/$VSCODE_VERSION_TO_UPDATE/package.json" | jq -r ".version")

  echo -e "Great! We'll prep a PR for updating to $VSCODE_EXACT_VERSION\n"

  # For some reason the subtree update doesn't work
  # unless we fetch all the branches
  echo -e "Fetching vscode branches..."
  echo -e "Note: this might take a while"
  git fetch vscode

  # Check if GitHub CLI is installed
  if ! command -v gh &>/dev/null; then
    echo "GitHub CLI could not be found."
    echo "If you install it before you run this script next time, we'll open a draft PR for you!"
    echo -e "See docs here: https://github.com/cli/cli#installation\n"
    exit
  fi

  # Push branch to remote if not already pushed
  # If we don't do this, the opening a draft PR step won't work
  # because it will stop and ask where you want to push the branch
  CURRENT_BRANCH=$(git branch | grep '\*' | cut -d' ' -f2-)
  if [[ -z $(git config "branch.${CURRENT_BRANCH}.remote") ]]; then
    echo "Doesn't look like you've pushed this branch to remote"
    echo -e "Pushing now using: git push origin $CURRENT_BRANCH\n"
    # Note: we need to set upstream as well or the gh pr create step will fail
    # See: https://github.com/cli/cli/issues/575
    echo "Please set the upstream and re-run the script"
    exit 1
  fi

  echo "Going to try to update vscode for you..."
  echo -e "Running: git subtree pull --prefix lib/vscode vscode release/${VSCODE_VERSION_TO_UPDATE} --squash\n"
  # Try to run subtree update command
  # Note: we add `|| true` because we want the script to keep running even if the squash fails
  # We know the squash fails everytime because there will always be merge conflicts
  git subtree pull --prefix lib/vscode vscode release/"${VSCODE_VERSION_TO_UPDATE}" --squash || true

  # Get the files with conflicts before we commit them
  # so we can list them in the PR body as todo items
  CONFLICTS=$(git diff --name-only --diff-filter=U | while read -r line; do echo "- [ ] $line"; done)
  PR_BODY=$(make_pr_body "$VSCODE_EXACT_VERSION" "$CONFLICTS")

  echo -e "\nForcing a commit with conflicts"
  echo "Note: this is intentional"
  echo "If we don't do this, code review is impossible."
  echo -e "For more info, see docs: docs/CONTRIBUTING.md#updating-vs-code\n"
  # We need --no-verify to skip the husky pre-commit hook
  # which fails because of the merge conflicts
  git add . && git commit -am "chore(vscode): update to $VSCODE_EXACT_VERSION" --no-verify

  # Note: we can't open a draft PR unless their are changes.
  # Hence why we do this after the subtree update.
  echo "Opening a draft PR on GitHub"
  # To read about these flags, visit the docs: https://cli.github.com/manual/gh_pr_create
  gh pr create --base main --title "feat(vscode): update to version $VSCODE_EXACT_VERSION" --body "$PR_BODY" --reviewer @cdr/code-server-reviewers --repo cdr/code-server --draft
}

main "$@"
