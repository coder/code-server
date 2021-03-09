#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."
  # We must keep jest in a sub-directory. See ../../test/package.json for more
  # information. We must also run it from the root otherwise coverage will not
  # include our source files.
  if [[ -z ${PASSWORD-} ]] || [[ -z ${CODE_SERVER_ADDRESS-} ]]; then
    echo "The end-to-end testing suites rely on your local environment"
    echo -e "\n"
    echo "Please set the following environment variables locally:"
    echo "  \$PASSWORD"
    echo "  \$CODE_SERVER_ADDRESS"
    echo -e "\n"
    echo "Please make sure you have code-server running locally with the flag:"
    echo "  --home \$CODE_SERVER_ADDRESS/healthz "
    echo -e "\n"
    exit 1
  fi
  CS_DISABLE_PLUGINS=true ./test/node_modules/.bin/jest "$@" --config ./test/jest.e2e.config.ts
}

main "$@"
