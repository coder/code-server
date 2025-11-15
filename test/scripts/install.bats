#!/usr/bin/env bats

SCRIPT_NAME="install.sh"
SCRIPT="$BATS_TEST_DIRNAME/../../$SCRIPT_NAME"

# Override version so it doesn't have to curl and to avoid caching in case the
# user already has the latest version installed.
export VERSION="9999.99.9"

function should-use-deb() {
  DISTRO=$1 ARCH=$2 OS=linux run "$SCRIPT" --dry-run
  [ "$status" -eq 0 ]
  [ "${lines[1]}" = "Installing v$VERSION of the $2 deb package from GitHub." ]
  [ "${lines[-6]}" = "deb package has been installed." ]
}

function should-use-rpm() {
  DISTRO=$1 ARCH=$2 OS=linux run "$SCRIPT" --dry-run
  [ "$status" -eq 0 ]
  [ "${lines[1]}" = "Installing v$VERSION of the $2 rpm package from GitHub." ]
  [ "${lines[-6]}" = "rpm package has been installed." ]
}

function should-fallback-npm() {
  YARN_PATH=true DISTRO=$1 ARCH=$2 OS=linux run "$SCRIPT" --dry-run
  [ "$status" -eq 0 ]
  [ "${lines[1]}" = "No standalone releases for $2." ]
  [ "${lines[2]}" = "Falling back to installation from npm." ]
  [ "${lines[3]}" = "Installing v$VERSION from npm." ]
  [ "${lines[-6]}" = "npm package has been installed." ]
}

function should-use-npm() {
  YARN_PATH=true DISTRO=$1 ARCH=$2 OS=linux run "$SCRIPT" --dry-run
  [ "$status" -eq 0 ]
  [ "${lines[1]}" = "Installing v$VERSION from npm." ]
  [ "${lines[-6]}" = "npm package has been installed." ]
}

function should-use-aur() {
  DISTRO=$1 ARCH=$2 OS=linux run "$SCRIPT" --dry-run
  [ "$status" -eq 0 ]
  [ "${lines[1]}" = "Installing latest from the AUR." ]
  [ "${lines[-6]}" = "AUR package has been installed." ]
}

function should-fallback-npm-brew() {
  YARN_PATH=true BREW_PATH= OS=macos ARCH=$1 run "$SCRIPT" --dry-run
  [ "$status" -eq 0 ]
  [ "${lines[1]}" = "Homebrew not installed." ]
  [ "${lines[2]}" = "Falling back to standalone installation." ]
  [ "${lines[3]}" = "No standalone releases for $1." ]
  [ "${lines[4]}" = "Falling back to installation from npm." ]
  [ "${lines[5]}" = "Installing v$VERSION from npm." ]
  [ "${lines[-6]}" = "npm package has been installed." ]
}

function should-use-brew() {
  BREW_PATH=true OS=macos ARCH=$1 run "$SCRIPT" --dry-run
  [ "$status" -eq 0 ]
  [ "${lines[1]}" = "Installing latest from Homebrew." ]
  [ "${lines[-4]}" = "Brew release has been installed." ]
}

function should-use-standalone() {
  DISTRO=$1 ARCH=$2 OS=$3 run "$SCRIPT" --method standalone --dry-run
  [ "$status" -eq 0 ]
  [ "${lines[1]}" = "Installing v$VERSION of the $2 release from GitHub." ]
  [[ "${lines[-6]}" = "Standalone release has been installed"* ]]
}

@test "$SCRIPT_NAME: usage with --help" {
  run "$SCRIPT" --help
  [ "$status" -eq 0 ]
  [ "${lines[0]}" = "Installs code-server." ]
  [[ "${lines[-1]}" = "More installation docs are at"* ]]
}

# These use the deb but fall back to npm for unsupported architectures.
@test "$SCRIPT_NAME: debian arm64" {
  should-use-deb "debian" "arm64"
}
@test "$SCRIPT_NAME: debian amd64" {
  should-use-deb "debian" "amd64"
}
@test "$SCRIPT_NAME: debian i386" {
  should-fallback-npm "debian" "i386"
}

# These use the rpm but fall back to npm for unsupported architectures.
@test "$SCRIPT_NAME: fedora arm64" {
  should-use-rpm "fedora" "arm64"
}
@test "$SCRIPT_NAME: fedora amd64" {
  should-use-rpm "fedora" "amd64"
}
@test "$SCRIPT_NAME: fedora i386" {
  should-fallback-npm "fedora" "i386"
}

# These always use npm regardless of the architecture.
@test "$SCRIPT_NAME: alpine arm64" {
  should-use-npm "alpine" "arm64"
}
@test "$SCRIPT_NAME: alpine amd64" {
  should-use-npm "alpine" "amd64"
}
@test "$SCRIPT_NAME: alpine i386" {
  should-use-npm "alpine" "i386"
}

@test "$SCRIPT_NAME: freebsd arm64" {
  should-use-npm "freebsd" "arm64"
}
@test "$SCRIPT_NAME: freebsd amd64" {
  should-use-npm "freebsd" "amd64"
}
@test "$SCRIPT_NAME: freebsd i386" {
  should-use-npm "freebsd" "i386"
}

# Arch Linux uses AUR but falls back to npm for unsuppported architectures.
@test "$SCRIPT_NAME: arch arm64" {
  should-use-aur "arch" "arm64"
}
@test "$SCRIPT_NAME: arch amd64" {
  should-use-aur "arch" "amd64"
}
@test "$SCRIPT_NAME: arch i386" {
  should-fallback-npm "arch" "i386"
}

# macOS use homebrew but falls back to standalone when brew is unavailable then
# to npm for unsupported architectures.
@test "$SCRIPT_NAME: macos amd64 (no brew)" {
  should-fallback-npm-brew "amd64"
}
@test "$SCRIPT_NAME: macos arm64 (no brew)" {
  BREW_PATH= OS=macos ARCH=arm64 run "$SCRIPT" --dry-run
  [ "$status" -eq 0 ]
  [ "${lines[1]}" = "Homebrew not installed." ]
  [ "${lines[2]}" = "Falling back to standalone installation." ]
  [ "${lines[3]}" = "Installing v$VERSION of the arm64 release from GitHub." ]
  [[ "${lines[-6]}" = "Standalone release has been installed"* ]]
}
@test "$SCRIPT_NAME: macos i386 (no brew)" {
  should-fallback-npm-brew "i386"
}

@test "$SCRIPT_NAME: macos arm64 (brew)" {
  should-use-brew "arm64"
}
@test "$SCRIPT_NAME: macos amd64 (brew)" {
  should-use-brew "amd64"
}
@test "$SCRIPT_NAME: macos i386 (brew)" {
  should-use-brew "i386"
}

# Force standalone.
@test "$SCRIPT_NAME: debian amd64 --method standalone" {
  should-use-standalone "debian" "amd64" "linux"
}
