#!/usr/bin/env bash

set -Eeuo pipefail

function unapply_patches() {
  local -i exit_code=0
  quiet quilt pop -af || exit_code=$?
  case $exit_code in
    # Sucessfully unapplied.
    0) ;;
    # No more patches to unapply.
    2) ;;
    # Some error.
    *) return $exit_code ;;
  esac
}

function update_vscode() {
  pushd lib/vscode
  if ! git checkout 2>&1 "$target_vscode_version" ; then
    echo "$target_vscode_version does not exist locally, fetching..."
    git fetch --all --prune --tags
    echo "Checking out $target_vscode_version again..."
    git checkout "$target_vscode_version"
  fi
  popd
}

function refresh_patches() {
  local -i exit_code=0
  while quiet quilt push ; ! (( exit_code=$? )) ; do
    quilt refresh
  done
  case $exit_code in
    # No more patches to apply.
    2) ;;
    # Some error.
    *) return $exit_code ;;
  esac
}

function update_node() {
  local node_version
  node_version=$(cat .node-version)
  local target_node_version
  target_node_version=$(grep target lib/vscode/remote/.npmrc | awk -F= '{print $2}' | tr -d '"')
  if [[ $node_version == "$target_node_version" ]] ; then
    echo "Already set to $target_node_version"
  else
    echo "Updating from $node_version to $target_node_version..."
    echo "$target_node_version" > .node-version
  fi
}

function get-webview-script-hash() {
  local html
  html=$(<"$1")
  local start_tag='<script async type="module">'
  local end_tag="</script>"
  html=${html##*"$start_tag"}
  html=${html%%"$end_tag"*}
  echo -n "$html" | openssl sha256 -binary | openssl base64
}

function update_csp() {
  local current
  current=$(quilt top 2>/dev/null || echo "")
  local patch_action=""
  echo "Currently at ${current:-base}"
  if [[ $current != */webview.diff ]] ; then
    echo "Moving to patches/webview.diff..."
    local -i exit_code=0
    if quilt applied 2>/dev/null | grep --quiet webview.diff ; then
      quiet quilt pop webview || exit_code=$?
      patch_action=pop
    else
      quiet quilt push webview || exit_code=$?
      patch_action=push
    fi
    case $exit_code in
      # Successfully moved.
      0) ;;
      # Some error.
      *) return $exit_code ;;
    esac
  fi

  local file=lib/vscode/src/vs/workbench/contrib/webview/browser/pre/index.html
  local hash
  hash=$(get-webview-script-hash "$file")
  echo "Calculated hash as $hash"
  # Use octothorpe as a delimiter since the hash may contain a slash.
  sed -i.bak "s#script-src 'sha256-[^']\+'#script-src 'sha256-$hash'#" "$file"
  quilt refresh

  if [[ $patch_action != "" ]] ; then
    echo "Moving back to ${current:-base}..."
    case $patch_action in
      pop) quiet quilt push "$current" ;;
      push) quiet quilt pop "${current:--a}" ;;
    esac
  fi
}

function add_changelog() {
  local file=CHANGELOG.md
  if grep --quiet "Code $target_vscode_version" "$file" ; then
    echo "Changelog for $target_vscode_version already exists"
  else
    # TODO: This is not exactly robust.  In particular, it needs to handle if
    # there is already a "changed" section.
    sed -i.bak "s/## Unreleased/## Unreleased\n\nCode v$target_vscode_version\n\n### Changed\n\n- Update to Code $target_vscode_version/" "$file"
  fi
}

function main() {
  cd "$(dirname "${0}")/../.."

  source ./ci/lib.sh

  declare -a steps

  # If version is not set, assume we are already at the target version and the
  # user is just trying to resolve conflics.
  local target_vscode_version
  if [[ ${VERSION-} ]] ; then
    # Removing patches only needs to be done locally; in CI we start from a
    # fresh clone each time.
    if [[ ! ${CI-} ]] ; then
      steps+=("Unapplying patches" "unapply_patches")
    fi
    target_vscode_version="${VERSION#v}"
    steps+=(
      "Update Code to $target_vscode_version" "update_vscode"
      "Refresh Code patches" "refresh_patches"
    )
  else
    target_vscode_version="$(git -C lib/vscode describe --tags --exact-match)"
    echo "Detected Code version $target_vscode_version"
  fi

  steps+=(
    "Update Node version" "update_node"
    "Update CSP webview hash" "update_csp"
    "Add changelog note" "add_changelog"
  )

  # Even if a step failed, still output the last checkmark.
  run-steps "${steps[@]}" || true

  # This step is always manual.
  echo "- [ ] Verify changelog" >> .cache/checklist
}

main "$@"
