#!/usr/bin/env bash
# Description: This is a script to make the release process easier
# Run it with `yarn release:prep` and it will do the following:
# 1. Check that you have gh installed and that you're signed in
# 2. Update the version of code-server (package.json, docs, etc.)
# 3. Update the code coverage badge in the README
# 4. Open a draft PR using the release_template.md and view in browser
# If you want to perform a dry run of this script run DRY_RUN=1 yarn release:prep

set -euo pipefail

main() {
  if [ "${DRY_RUN-}" = 1 ]; then
    echo "Performing a dry run..."
    CMD="echo"
  else
    CMD=''
  fi

  cd "$(dirname "$0")/../.."

  # Check that gh is installed
  if ! command -v gh &> /dev/null; then
    echo "gh could not be found."
    echo "We use this with the release-github-draft.sh and release-github-assets.sh scripts."
    echo -e "See docs here: https://github.com/cli/cli#installation"
    exit
  fi

  # Check that they have jq installed
  if ! command -v jq &> /dev/null; then
    echo "jq could not be found."
    echo "We use this to parse the package.json and grab the current version of code-server."
    echo -e "See docs here: https://stedolan.github.io/jq/download/"
    exit
  fi

  # Check that they have rg installed
  if ! command -v rg &> /dev/null; then
    echo "rg could not be found."
    echo "We use this when updating files across the codebase."
    echo -e "See docs here: https://github.com/BurntSushi/ripgrep#installation"
    exit
  fi

  # Check that they have node installed
  if ! command -v node &> /dev/null; then
    echo "node could not be found."
    echo "That's surprising..."
    echo "We use it in this script for getting the package.json version"
    echo -e "See docs here: https://nodejs.org/en/download/"
    exit
  fi

  # Check that gh is authenticated
  if ! gh auth status -h github.com &> /dev/null; then
    echo "gh isn't authenticated to github.com."
    echo "This is needed for our scripts that use gh."
    echo -e "See docs regarding authentication: https://cli.github.com/manual/gh_auth_login"
    exit
  fi

  # Note: we need to set upstream as well or the gh pr create step will fail
  # See: https://github.com/cli/cli/issues/575
  CURRENT_BRANCH=$(git branch | grep '\*' | cut -d' ' -f2-)
  if [[ -z $(git config "branch.${CURRENT_BRANCH}.remote") ]]; then
    echo "Doesn't look like you've pushed this branch to remote"
    # Note: we need to set upstream as well or the gh pr create step will fail
    # See: https://github.com/cli/cli/issues/575
    echo "Please set the upstream and then run the script"
    exit 1
  fi

  # credit to jakwuh for this solution
  # https://gist.github.com/DarrenN/8c6a5b969481725a4413#gistcomment-1971123
  CODE_SERVER_CURRENT_VERSION=$(node -pe "require('./package.json').version")
  # Ask which version we should update to
  # In the future, we'll automate this and determine the latest version automatically
  echo "Current version: ${CODE_SERVER_CURRENT_VERSION}"
  # The $'\n' adds a line break. See: https://stackoverflow.com/a/39581815/3015595
  read -r -p "What version of code-server do you want to update to?"$'\n' CODE_SERVER_VERSION_TO_UPDATE

  echo -e "Great! We'll prep a PR for updating to $CODE_SERVER_VERSION_TO_UPDATE\n"
  $CMD rg -g '!yarn.lock' -g '!*.svg' -g '!CHANGELOG.md' -g '!lib/vscode/**' --files-with-matches --fixed-strings "${CODE_SERVER_CURRENT_VERSION}" | $CMD xargs sd "$CODE_SERVER_CURRENT_VERSION" "$CODE_SERVER_VERSION_TO_UPDATE"

  $CMD git commit --no-verify -am "chore(release): bump version to $CODE_SERVER_VERSION_TO_UPDATE"

  # This runs from the root so that's why we use this path vs. ../../
  RELEASE_TEMPLATE_STRING=$(cat ./.github/PULL_REQUEST_TEMPLATE/release_template.md)

  echo -e "\nOpening a draft PR on GitHub"
  # To read about these flags, visit the docs: https://cli.github.com/manual/gh_pr_create
  $CMD gh pr create --base main --title "release: $CODE_SERVER_VERSION_TO_UPDATE" --body "$RELEASE_TEMPLATE_STRING" --reviewer @coder/code-server-reviewers --repo coder/code-server --draft --assignee "@me"

  # Open PR in browser
  $CMD gh pr view --web
}

main "$@"
