#!/usr/bin/env bash

set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."

  # This, strangely enough, fixes the arm build being terminated for not having
  # output on Travis. It's as if output is buffered and only displayed once a
  # certain amount is collected. Five seconds didn't work but one second seems
  # to generate enough output to make it work.
  local pid
  while true; do
    echo 'Still running...'
    sleep 1
  done &
  pid=$!

  docker build ci/image
  imageTag="$(docker build -q ci/image)"
  docker run -t --rm -e CI -e GITHUB_TOKEN -e TRAVIS_TAG -v "$(yarn cache dir):/usr/local/share/.cache/yarn/v6" -v "$PWD:/repo" -w /repo "$imageTag" "$*"

  kill $pid
}

main "$@"
