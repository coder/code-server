#!/usr/bin/env bash
source ./ci/lib.sh

# Grabs the most recent ci.yaml github workflow run that was successful and triggered from the same commit being pushd.
# This will contain the artifacts we want.
# https://developer.github.com/v3/actions/workflow-runs/#list-workflow-runs
get_artifacts_url() {
  curl -sSL 'https://api.github.com/repos/cdr/code-server/actions/workflows/ci.yaml/runs?status=success&event=push' | jq -r ".workflow_runs[] | select(.head_sha == \"$(git rev-parse HEAD)\") | .artifacts_url" | head -n 1
}

# Grabs the artifact's download url.
# https://developer.github.com/v3/actions/artifacts/#list-workflow-run-artifacts
get_artifact_url() {
  local artifact_name="$1"
  curl -sSL "$(get_artifacts_url)" | jq -r ".artifacts[] | select(.name == \"$artifact_name\") | .archive_download_url" | head -n 1
}

# Uses the above two functions to download a artifact into a directory.
download_artifact() {
  local artifact_name="$1"
  local dst="$2"

  local tmp_file
  tmp_file="$(mktemp)"

  curl -sSL "$(get_artifact_url "$artifact_name")" > "$tmp_file"
  unzip -o "$tmp_file" -d "$dst"
  rm "$tmp_file"
}
