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

if [[ ! ${ARCH-} ]]; then
  ARCH=$(arch)
  export ARCH
fi

if [[ ! ${OS-} ]]; then
  OS=$(os)
  export OS
fi

# RELEASE_PATH is the destination directory for the release from the root.
# Defaults to release
if [[ ! ${RELEASE_PATH-} ]]; then
  RELEASE_PATH="release"
  export RELEASE_PATH
fi

nodeOS() {
  osname=$OS
  case $osname in
    macos) osname=darwin ;;
    windows) osname=win32 ;;
  esac
  echo "$osname"
}

nodeArch() {
  cpu=$ARCH
  case $cpu in
    amd64) cpu=x64 ;;
  esac
  echo "$cpu"
}

run-steps() {
  local -i failed=0
  mkdir -p .cache
  rm -f .cache/checklist
  while (( $# )) ; do
    local name=$1 ; shift
    local fn=$1 ; shift
    # Only run if an earlier step has not failed.
    if [[ $failed == 0 ]] ; then
      echo "$name..."
      if $fn | indent ; then
        echo "- [X] $name" >> .cache/checklist
      else
        ((failed++))
      fi
    fi
    # For all failed steps, write out an empty checkbox.
    if [[ $failed != 0 ]] ; then
      echo "- [ ] $name" >> .cache/checklist
    fi
  done
  if [[ $failed != 0 ]] ; then
    return 1
  fi
}

quiet() {
  "$@" >/dev/null
}

indent() {
  local count=2
  local space
  space=$(printf "%${count}s")
  sed "s/^/$space| /g"
}

# See gulpfile.reh.ts for available targets.
if [[ ! ${VSCODE_TARGET-} ]]; then
  VSCODE_TARGET="$(nodeOS)-$(nodeArch)"
  export VSCODE_TARGET
fi
