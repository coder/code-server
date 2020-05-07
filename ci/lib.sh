#!/usr/bin/env bash

pushd() {
  builtin pushd "$@" > /dev/null
}

popd() {
  builtin popd > /dev/null
}

pkg_json_version() {
  jq -r .version package.json
}

os() {
  local os
  os=$(uname | tr '[:upper:]' '[:lower:]')
  if [[ $os == "linux" ]]; then
    # Alpine's ldd doesn't have a version flag but if you use an invalid flag
    # (like --version) it outputs the version to stderr and exits with 1.
    local ldd_output
    ldd_output=$(ldd --version 2>&1 || true)
    if echo "$ldd_output" | grep -iq musl; then
      os="alpine"
    fi
  fi
  echo "$os"
}

arch() {
  case "$(uname -m)" in
  aarch64)
    echo arm64
    ;;
  x86_64)
    echo amd64
    ;;
  *)
    echo "unknown architecture $(uname -a)"
    exit 1
    ;;
  esac
}
