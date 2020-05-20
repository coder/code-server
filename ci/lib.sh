#!/usr/bin/env bash

pushd() {
  builtin pushd "$@" > /dev/null
}

popd() {
  builtin popd > /dev/null
}

pkg_json_version() {
  jq -r .version package.json
}

vscode_version() {
  jq -r .version lib/vscode/package.json
}

os() {
  local os
  os=$(uname | tr '[:upper:]' '[:lower:]')
  if [[ $os == "linux" ]]; then
    # Alpine's ldd doesn't have a version flag but if you use an invalid flag
    # (like --version) it outputs the version to stderr and exits with 1.
    local ldd_output
    ldd_output=$(ldd --version 2>&1 || true)
    if echo "$ldd_output" | grep -iq musl; then
      os="alpine"
    fi
  elif [[ $os == "darwin" ]]; then
    os="macos"
  fi
  echo "$os"
}

arch() {
  case "$(uname -m)" in
  aarch64)
    echo arm64
    ;;
  x86_64)
    echo amd64
    ;;
  *)
    echo "unknown architecture $(uname -a)"
    exit 1
    ;;
  esac
}

curl() {
  command curl -H "Authorization: token $GITHUB_TOKEN" "$@"
}

# Grabs the most recent ci.yaml github workflow run that was successful and triggered from the same commit being pushd.
# This will contain the artifacts we want.
# https://developer.github.com/v3/actions/workflow-runs/#list-workflow-runs
get_artifacts_url() {
  curl -fsSL 'https://api.github.com/repos/cdr/code-server/actions/workflows/ci.yaml/runs?status=success&event=push' | jq -r ".workflow_runs[] | select(.head_sha == \"$(git rev-parse HEAD)\") | .artifacts_url" | head -n 1
}

# Grabs the artifact's download url.
# https://developer.github.com/v3/actions/artifacts/#list-workflow-run-artifacts
get_artifact_url() {
  local artifact_name="$1"
  curl -fsSL "$(get_artifacts_url)" | jq -r ".artifacts[] | select(.name == \"$artifact_name\") | .archive_download_url" | head -n 1
}

# Uses the above two functions to download a artifact into a directory.
download_artifact() {
  local artifact_name="$1"
  local dst="$2"

  local tmp_file
  tmp_file="$(mktemp)"

  curl -fsSL "$(get_artifact_url "$artifact_name")" > "$tmp_file"
  unzip -q -o "$tmp_file" -d "$dst"
  rm "$tmp_file"
}

rsync() {
  command rsync -a --del "$@"
}

VERSION="$(pkg_json_version)"
export VERSION
ARCH="$(arch)"
export ARCH
OS=$(os)
export OS

# RELEASE_PATH is the destination directory for the release from the root.
# Defaults to release
RELEASE_PATH="${RELEASE_PATH-release}"
