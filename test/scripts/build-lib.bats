#!/usr/bin/env bats

SCRIPT_NAME="build-lib.sh"
SCRIPT="$BATS_TEST_DIRNAME/../../ci/build/$SCRIPT_NAME"

source "$SCRIPT"

@test "get_nfpm_arch should return armhfp for rpm on armv7l" {
  run get_nfpm_arch rpm armv7l
  [ "$output" = "armhfp" ]
}

@test "get_nfpm_arch should return armhf for deb on armv7l" {
  run get_nfpm_arch deb armv7l
  [ "$output" = "armhf" ]
}

@test "get_nfpm_arch should return arch if no arch override exists " {
  run get_nfpm_arch deb i386
  [ "$output" = "i386" ]
}