#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  docker build ci/container
  imageTag="$(docker build -q ci/container)"
  docker run \
    --rm \
    -e CI \
    -e GITHUB_TOKEN \
    -e TRAVIS_TAG \
    -e NPM_TOKEN \
    -v "$(yarn cache dir):/usr/local/share/.cache/yarn/v6" \
    $(if [[ -f ~/.npmrc ]]; then echo -v "$HOME/.npmrc:/root/.npmrc"; fi) \
    -v "$PWD:/repo" \
    -w /repo \
    $(if [[ -t 0 ]]; then echo -it; fi) \
    "$imageTag" \
    "$*"
}

main "$@"
