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

  # NOTE@jsjoeio - only needed if we use the download_artifact
  # because we talk to the GitHub API.
  # Needed to use GitHub API
  if ! is_env_var_set "GITHUB_TOKEN"; then
    echo "GITHUB_TOKEN is not set. Cannot download npm release artifact without GitHub credentials."
    exit 1
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
  if ! is_env_var_set "ENVIRONMENT"; then
    echo "ENVIRONMENT is not set. Cannot determine npm tag without ENVIRONMENT."
    exit 1
  fi

  ## Publishing Information
  # All the variables below are used to determine how we should publish
  # the npm package. We also use this information for bumping the version.
  # This is because npm won't publish your package unless it's a new version.
  # i.e. for development, we bump the version to <current version>-<pr number>-<commit sha>
  # example: "version": "4.0.1-4769-ad7b23cfe6ffd72914e34781ef7721b129a23040"
  # We need the current package.json VERSION
  if ! is_env_var_set "VERSION"; then
    echo "VERSION is not set. Cannot publish to npm without VERSION."
    exit 1
  fi

  # We need TAG to know what to publish under on npm
  # Options are "latest", "beta", or "<pr number >"
  # See Environment comments above to know when each is used.
  if ! is_env_var_set "NPM_TAG"; then
    echo "NPM_TAG is not set. This is needed for tagging the npm release."
    exit 1
  fi

  echo "using tag: $NPM_TAG"

  # This allows us to publish to npm in CI workflows
  if [[ ${CI-} ]]; then
    echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc
  fi

  download_artifact npm-package ./release-npm-package
  # https://github.com/actions/upload-artifact/issues/38
  tar -xzf release-npm-package/package.tar.gz

  # Ignore symlink when publishing npm package
  # See: https://github.com/cdr/code-server/pull/3935
  echo "node_modules.asar" > release/.npmignore

  # NOTES:@jsjoeio
  # We only need to run npm version for "development" and "staging".
  # This is because our release:prep script automatically bumps the version
  # in the package.json and we commit it as part of the release PR.
  if [[ ENVIRONMENT == "production" ]]; then
    NPM_VERSION="$VERSION"
  else
    echo "Not a production environment"
    echo "Found environment: $ENVIRONMENT"
    echo "Manually bumping npm version..."

    if ! is_env_var_set "PR_NUMBER_AND_COMMIT_SHA"; then
      echo "PR_NUMBER_AND_COMMIT_SHA is not set. This is needed for setting the npm version in non-production environments."
      exit 1
    fi

    # We modify the version in the package.json
    # to be the current version + the PR number + commit SHA
    # Example: "version": "4.0.1-4769-ad7b23cfe6ffd72914e34781ef7721b129a23040"
    NPM_VERSION="$VERSION-$PR_NUMBER_AND_COMMIT_SHA"
    pushd release
    # NOTE:@jsjoeio
    # I originally tried to use `yarn version` but ran into issues and abandoned it.
    npm version "$NPM_VERSION"
    popd
  fi

  # We need to make sure we haven't already published the version.
  # This is because npm view won't exit with non-zero so we have
  # to check the output.
  local hasVersion
  hasVersion=$(npm view "code-server@$NPM_VERSION" version)
  if [[ $hasVersion == "$NPM_VERSION" ]]; then
    echo "$NPM_VERSION is already published
    return
  fi

  yarn publish --non-interactive release --tag "$NPM_TAG"
}

main "$@"
