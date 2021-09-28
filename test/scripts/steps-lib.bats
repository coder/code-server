#!/usr/bin/env bats

SCRIPT_NAME="steps-lib.sh"
SCRIPT="$BATS_TEST_DIRNAME/../../ci/steps/$SCRIPT_NAME"

source "$SCRIPT"

@test "is_env_var_set should return 1 if env var is not set" {
  run is_env_var_set "ASDF_TEST_SET"
  [ "$status" = 1 ]
}

@test "is_env_var_set should return 0 if env var is set" {
  ASDF_TEST_SET="test" run is_env_var_set "ASDF_TEST_SET"
  [ "$status" = 0 ]
}

@test "directory_exists should 1 if directory doesn't exist" {
  run directory_exists "/tmp/asdfasdfasdf"
  [ "$status" = 1 ]
}

@test "directory_exists should 0 if directory exists" {
  run directory_exists "$(pwd)"
  [ "$status" = 0 ]
}

@test "file_exists should 1 if file doesn't exist" {
  run file_exists "hello-asfd.sh"
  [ "$status" = 1 ]
}

@test "file_exists should 0 if file exists" {
  run file_exists "$SCRIPT"
  [ "$status" = 0 ]
}

@test "is_executable should 1 if file isn't executable" {
  run is_executable "hello-asfd.sh"
  [ "$status" = 1 ]
}

@test "is_executable should 0 if file is executable" {
  run is_executable "$SCRIPT"
  [ "$status" = 0 ]
}