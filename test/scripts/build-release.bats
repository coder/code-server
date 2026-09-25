#!/usr/bin/env bats

SCRIPT="$BATS_TEST_DIRNAME/../../ci/build/add-vscode-extension-dependencies.sh"

@test "add-vscode-extension-dependencies.sh: hoists git fs-copyfile runtime dependency" {
  fixture="$BATS_TEST_TMPDIR/extensions"
  mkdir -p "$fixture/git"

  cat > "$fixture/package.json" <<'JSON'
{
  "name": "vscode-extensions",
  "version": "0.0.1",
  "dependencies": {
    "typescript": "^6.0.3"
  }
}
JSON

  cat > "$fixture/git/package.json" <<'JSON'
{
  "name": "git",
  "version": "10.0.0",
  "dependencies": {
    "@vscode/fs-copyfile": "2.0.0",
    "byline": "^5.0.0"
  }
}
JSON

  run "$SCRIPT" "$fixture/package.json" "$fixture"

  [ "$status" -eq 0 ]
  [ "$(jq -r '.dependencies["@vscode/fs-copyfile"]' "$fixture/package.json")" = "2.0.0" ]
  [ "$(jq -r '.dependencies.typescript' "$fixture/package.json")" = "^6.0.3" ]
  [ "$(jq -r '.dependencies.byline // empty' "$fixture/package.json")" = "" ]
}

@test "add-vscode-extension-dependencies.sh: fails when VS Code git manifest drops fs-copyfile" {
  fixture="$BATS_TEST_TMPDIR/extensions"
  mkdir -p "$fixture/git"

  cat > "$fixture/package.json" <<'JSON'
{
  "name": "vscode-extensions",
  "version": "0.0.1"
}
JSON

  cat > "$fixture/git/package.json" <<'JSON'
{
  "name": "git",
  "version": "10.0.0",
  "dependencies": {}
}
JSON

  run "$SCRIPT" "$fixture/package.json" "$fixture"

  [ "$status" -eq 1 ]
  [[ "$output" = *"Expected @vscode/fs-copyfile"* ]]
}
