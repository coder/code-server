#!/usr/bin/env bash
set -euo pipefail

pushd() {
  builtin pushd "$@" > /dev/null
}

popd() {
  builtin popd > /dev/null
}

vscode_version() {
  jq -r .version lib/vscode/package.json
}

os() {
  osname=$(uname | tr '[:upper:]' '[:lower:]')
  case $osname in
    linux)
      # Alpine's ldd doesn't have a version flag but if you use an invalid flag
      # (like --version) it outputs the version to stderr and exits with 1.
      # TODO: Better to check /etc/os-release; see ../install.sh.
      ldd_output=$(ldd --version 2>&1 || true)
      if echo "$ldd_output" | grep -iq musl; then
        osname="alpine"
      fi
      ;;
    darwin) osname="macos" ;;
    cygwin* | mingw*) osname="windows" ;;
  esac
  echo "$osname"
}

arch() {
  cpu="$(uname -m)"
  case "$cpu" in
    aarch64) cpu=arm64 ;;
    x86_64) cpu=amd64 ;;
  esac
  echo "$cpu"
}

rsync() {
  command rsync -a --del "$@"
}

ARCH="$(arch)"
export ARCH
OS=$(os)
export OS

# RELEASE_PATH is the destination directory for the release from the root.
# Defaults to release
RELEASE_PATH="${RELEASE_PATH-release}"
