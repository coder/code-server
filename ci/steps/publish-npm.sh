#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."
  source ./ci/lib.sh
  source ./ci/steps/steps-lib.sh

  ## Authentication tokens
  # Needed to publish on NPM
  if ! is_env_var_set "NPM_TOKEN"; then
    echo "NPM_TOKEN is not set. Cannot publish to npm without credentials."
    exit 1
  fi

  ## Publishing Information
  # All the variables below are used to determine how we should publish
  # the npm package. We also use this information for bumping the version.
  # This is because npm won't publish your package unless it's a new version.
  # i.e. for development, we bump the version to <current version>-<pr number>-<commit sha>
  # example: "version": "4.0.1-4769-ad7b23cfe6ffd72914e34781ef7721b129a23040"
  # We use this to grab the PR_NUMBER
  if ! is_env_var_set "GITHUB_REF"; then
    echo "GITHUB_REF is not set. Are you running this locally? We rely on values provided by GitHub."
    exit 1
  fi

  # We use this when setting NPM_VERSION
  if ! is_env_var_set "GITHUB_SHA"; then
    echo "GITHUB_SHA is not set. Are you running this locally? We rely on values provided by GitHub."
    exit 1
  fi

  # We use this to determine the NPM_ENVIRONMENT
  if ! is_env_var_set "GITHUB_EVENT_NAME"; then
    echo "GITHUB_EVENT_NAME is not set. Are you running this locally? We rely on values provided by GitHub."
    exit 1
  fi

  # Check that we're using at least v7 of npm CLI
  if ! command -v jq &> /dev/null; then
    echo "Couldn't find jq"
    echo "We need this in order to modify the package.json for dev builds."
    exit 1
  fi

  # This allows us to publish to npm in CI workflows
  if [[ ${CI-} ]]; then
    echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc
  fi

  ## Environment
  # This string is used to determine how we should tag the npm release.
  # Environment can be one of three choices:
  # "development" - this means we tag with the PR number, allowing
  # a developer to install this version with `yarn add code-server@<pr-number>`
  # "staging" - this means we tag with `beta`, allowing
  # a developer to install this version with `yarn add code-server@beta`
  # "production" - this means we tag with `latest` (default), allowing
  # a developer to install this version with `yarn add code-server@latest`
  if ! is_env_var_set "NPM_ENVIRONMENT"; then
    echo "NPM_ENVIRONMENT is not set."
    echo "Determining in script based on GITHUB environment variables."

    if [[ "$GITHUB_EVENT_NAME" == 'push' && "$GITHUB_REF" == 'refs/heads/main' ]]; then
      NPM_ENVIRONMENT="staging"
    else
      NPM_ENVIRONMENT="development"
    fi

  fi

  # NOTE@jsjoeio - this script assumes we have the artifact downloaded on disk
  # That happens in CI as a step before we run this.
  # https://github.com/actions/upload-artifact/issues/38
  tar -xzf release-npm-package/package.tar.gz

  # We use this to set the name of the package in the
  # package.json
  PACKAGE_NAME="code-server"

  # NOTES:@jsjoeio
  # We only need to run npm version for "development" and "staging".
  # This is because our release:prep script automatically bumps the version
  # in the package.json and we commit it as part of the release PR.
  if [[ "$NPM_ENVIRONMENT" == "production" ]]; then
    NPM_VERSION="$VERSION"
    # This means the npm version will be published as "stable"
    # and installed when a user runs `yarn install code-server`
    NPM_TAG="latest"
  else
    COMMIT_SHA="$GITHUB_SHA"

    if [[ "$NPM_ENVIRONMENT" == "staging" ]]; then
      NPM_VERSION="$VERSION-beta-$COMMIT_SHA"
      # This means the npm version will be tagged with "beta"
      # and installed when a user runs `yarn install code-server@beta`
      NPM_TAG="beta"
      PACKAGE_NAME="@coder/code-server-pr"
    fi

    if [[ "$NPM_ENVIRONMENT" == "development" ]]; then
      # Source: https://github.com/actions/checkout/issues/58#issuecomment-614041550
      PR_NUMBER=$(echo "$GITHUB_REF" | awk 'BEGIN { FS = "/" } ; { print $3 }')
      NPM_VERSION="$VERSION-$PR_NUMBER-$COMMIT_SHA"
      PACKAGE_NAME="@coder/code-server-pr"
      # This means the npm version will be tagged with "<pr number>"
      # and installed when a user runs `yarn install code-server@<pr number>`
      NPM_TAG="$PR_NUMBER"
    fi

    echo "- tag: $NPM_TAG"
    echo "- version: $NPM_VERSION"
    echo "- package name: $PACKAGE_NAME"
    echo "- npm environment: $NPM_ENVIRONMENT"

    # We modify the version in the package.json
    # to be the current version + the PR number + commit SHA
    # or we use current version + beta + commit SHA
    # Example: "version": "4.0.1-4769-ad7b23cfe6ffd72914e34781ef7721b129a23040"
    # Example: "version": "4.0.1-beta-ad7b23cfe6ffd72914e34781ef7721b129a23040"
    pushd release
    # NOTE@jsjoeio
    # I originally tried to use `yarn version` but ran into issues and abandoned it.
    npm version "$NPM_VERSION"
    # NOTE@jsjoeio
    # Use the development package name
    # This is so we don't clutter the code-server versions on npm
    # with development versions.
    # jq can't edit in place so we must store in memory and echo
    local contents
    contents="$(jq ".name |= \"$PACKAGE_NAME\"" package.json)"
    echo "${contents}" > package.json
    popd
  fi

  # NOTE@jsjoeio
  # We need to make sure we haven't already published the version.
  # If we get error, continue with script because we want to publish
  # If version is valid, we check if we're publishing the same one
  local hasVersion
  if hasVersion=$(npm view "$PACKAGE_NAME@$NPM_VERSION" version 2> /dev/null) && [[ $hasVersion == "$NPM_VERSION" ]]; then
    echo "$NPM_VERSION is already published under $PACKAGE_NAME"
    return
  fi

  # NOTE@jsjoeio
  # Since the dev builds are scoped to @coder
  # We pass --access public to ensure npm knows it's not private.
  yarn publish --non-interactive release --tag "$NPM_TAG" --access public
}

main "$@"
