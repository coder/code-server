#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."
  source ./ci/lib.sh

  if [[ $(arch) == arm64 ]]; then
    # This, strangely enough, fixes the arm build being terminated for not having
    # output on Travis. It's as if output is buffered and only displayed once a
    # certain amount is collected. Five seconds didn't work but one second seems
    # to generate enough output to make it work.
    while true; do
      echo 'Still running...'
      sleep 1
    done &
    trap "exit" INT TERM
    trap "kill 0" EXIT
  fi

  ./ci/container/exec.sh ./ci/steps/static-release.sh
  ./ci/container/exec.sh yarn pkg
  ./ci/release-container/push.sh
}

main "$@"
