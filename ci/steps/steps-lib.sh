#!/usr/bin/env bash

# This is a library which contains functions used inside ci/steps
#
# We separated it into it's own file so that we could easily unit test
# these functions and helpers

# Checks whether and environment variable is set.
# Source: https://stackoverflow.com/a/62210688/3015595
is_env_var_set() {
  local name="${1:-}"
  if test -n "${!name:-}"; then
    return 0
  else
    return 1
  fi
}

# Checks whether a directory exists.
directory_exists() {
  local dir="${1:-}"
  if [[ -d "${dir:-}" ]]; then
    return 0
  else
    return 1
  fi
}

# Checks whether a file exists.
file_exists() {
  local file="${1:-}"
  if test -f "${file:-}"; then
    return 0
  else
    return 1
  fi
}

# Checks whether a file is executable.
is_executable() {
  local file="${1:-}"
  if [ -f "${file}" ] && [ -r "${file}" ] && [ -x "${file}" ]; then
    return 0
  else
    return 1
  fi
}
