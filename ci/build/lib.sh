#!/usr/bin/env bash
source ./ci/lib.sh

# RELEASE_PATH is the destination directory for the release from the root.
# Defaults to release
RELEASE_PATH="${RELEASE_PATH-release}"

rsync() {
  command rsync -a --del "$@"
}
