#!/usr/bin/env bash

# This is a library which contains functions used inside ci/build
#
# We separated it into it's own file so that we could easily unit test
# these functions and helpers.

# On some CPU architectures (notably node/uname "armv7l", default on Raspberry Pis),
# different package managers have different labels for the same CPU (deb=armhf, rpm=armhfp).
# This function returns the overriden arch on platforms
# with alternate labels, or the same arch otherwise.
get_nfpm_arch() {
  local PKG_FORMAT="${1:-}"
  local ARCH="${2:-}"

  case "$ARCH" in
    armv7l)
      if [ "$PKG_FORMAT" = "deb" ]; then
        echo armhf
      elif [ "$PKG_FORMAT" = "rpm" ]; then
        echo armhfp
      fi
      ;;
    *)
      echo "$ARCH"
      ;;
  esac
}
