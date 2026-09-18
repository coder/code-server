#!/usr/bin/env bash
set -euo pipefail

main() {
  if [[ $# -ne 2 ]]; then
    echo "Usage: $0 <extensions package.json> <VS Code extensions source dir>" >&2
    exit 1
  fi

  local package_json="$1"
  local vscode_extensions_src_path="$2"

  # VS Code's optimizer keeps a runtime require("@vscode/fs-copyfile") in the
  # built git extension but strips dependencies from the built extension
  # package.json. code-server's npm postinstall installs from lib/vscode/extensions,
  # so hoist this runtime dependency into the shared extension manifest.
  add_dependency_from_extension_package \
    "$package_json" \
    "$vscode_extensions_src_path/git/package.json" \
    "@vscode/fs-copyfile"
}

add_dependency_from_extension_package() {
  local package_json="$1"
  local source_package_json="$2"
  local dependency="$3"

  if [[ ! -f $package_json ]]; then
    echo "Missing package manifest: $package_json" >&2
    exit 1
  fi

  if [[ ! -f $source_package_json ]]; then
    echo "Missing source extension manifest: $source_package_json" >&2
    exit 1
  fi

  local version
  version="$(jq -r --arg dependency "$dependency" '.dependencies[$dependency] // empty' "$source_package_json")"
  if [[ -z $version ]]; then
    echo "Expected $dependency in $source_package_json dependencies" >&2
    exit 1
  fi

  local package_json_tmp
  package_json_tmp="$(mktemp)"
  cp -p "$package_json" "$package_json_tmp"
  jq \
    --arg dependency "$dependency" \
    --arg version "$version" \
    '.dependencies = (.dependencies // {}) | .dependencies[$dependency] = $version' \
    "$package_json" > "$package_json_tmp"
  mv "$package_json_tmp" "$package_json"
}

main "$@"
