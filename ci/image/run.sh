#!/usr/bin/env bash

set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  docker build ci/image
  imageTag="$(docker build -q ci/image)"
  docker run -t --rm -e CI -e GITHUB_TOKEN -e TRAVIS_TAG -v "$(yarn cache dir):/usr/local/share/.cache/yarn/v6" -v "$PWD:/repo" -w /repo "$imageTag" "$*"
}

main "$@"
