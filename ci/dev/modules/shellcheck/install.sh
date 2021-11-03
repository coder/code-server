#!/usr/bin/env sh

set -e

[ -z "$DEBUG" ] || { export PS4='+ [shellcheck/${BASH_SOURCE##*/}:${LINENO}] '; set -x; }

tar_options() {
  case "$(tar --version)" in
    bsdtar*) echo -xz;;
    *) echo -xJ;;
  esac
}

# Download & Extract
node download.js | tar "$(tar_options)"
