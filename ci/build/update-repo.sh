#!/usr/bin/env bash

set -Eeuo pipefail

# Given versions $1 and $2 figure out the first component that is different
# (major, minor, patch).
function find_version_diff() {
  # shellcheck disable=SC2206
  local a=( ${1//./ } )
  # shellcheck disable=SC2206
  local b=( ${2//./ } )

  if [[ ${a[0]} != "${b[0]}" ]] ; then
    echo major
  elif [[ ${a[1]} != "${b[1]}" ]] ; then
    echo minor
  else
    echo patch
  fi
}

# Bump $1 by the bump type (major, minor, patch) in $2.
function bump_version() {
  # shellcheck disable=SC2206
  local a=( ${1//./ } )
  case $2 in
    major)
      ((a[0]++))
      a[1]=0
      a[2]=0
      ;;
    minor)
      ((a[1]++))
      a[2]=0
      ;;
    *)
      ((a[2]++))
      ;;
  esac
  echo "${a[0]}.${a[1]}.${a[2]}"
}

function update_helm() {
  local chart_version
  chart_version=$(yq .version ci/helm-chart/Chart.yaml)
  local app_version
  app_version=$(yq .appVersion ci/helm-chart/Chart.yaml)
  local image_version
  image_version=$(yq .image.tag ci/helm-chart/values.yaml)

  local bump_type
  bump_type=$(find_version_diff "$app_version" "$version")
  local chart_version_bump
  chart_version_bump=$(bump_version "$chart_version" "$bump_type")

  # Use sed to replace because yq will reformat.
  echo "Bumping version from $chart_version to $chart_version_bump..."
  sed -i.bak "s/^version: $chart_version\$/version: $chart_version_bump/" ci/helm-chart/Chart.yaml

  echo "Bumping app version from $app_version to $version..."
  sed -i.bak "s/^appVersion: .\+\$/appVersion: $version/" ci/helm-chart/Chart.yaml

  echo "Bumping image version from $image_version to $version..."
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
