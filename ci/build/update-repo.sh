#!/usr/bin/env bash

set -Eeuo pipefail

function update_helm() {
  local current
  current=$(yq .version ci/helm-chart/Chart.yaml)
  local next
  next=$(semver "$current" -i minor)
  echo "Bumping version from $current to $next..."
  sed -i.bak "s/^version: $current\$/version: $next/" ci/helm-chart/Chart.yaml

  echo "Setting app version and image to $version..."
  sed -i.bak "s/^appVersion: .\+\$/appVersion: $version/" ci/helm-chart/Chart.yaml
  sed -i.bak "s/^  tag: .\+\$/  tag: '$version'/" ci/helm-chart/values.yaml
}

function update_changelog() {
  local date
  date=$(printf '%(%Y-%m-%d)T\n' -1)
  local link="https://github.com/coder/code-server/releases/tag/v$version"
  sed -i.bak "s|## Unreleased|## Unreleased\n\n## [$version]($link) - $date|" CHANGELOG.md
}

function main() {
  cd "$(dirname "${0}")/../.."

  source ./ci/lib.sh

  local version=${VERSION:-$(git describe --tags)}
  version="${version#v}"

  declare -a steps

  steps+=(
    "Update Helm chart" "update_helm"
    "Update changelog" "update_changelog"
  )

  # Even if a step failed, still output the last checkmark.
  run-steps "${steps[@]}" || true

  # This step is always manual.
  echo "- [ ] https://github.com/coder/code-server-aur/pulls" >> .cache/checklist
}

main "$@"
