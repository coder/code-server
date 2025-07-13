# Integration testing

Headscale relies on integration testing to ensure we remain compatible with Tailscale.

This is typically performed by starting a Headscale server and running a test "scenario"
with an array of Tailscale clients and versions.

Headscale's test framework and the current set of scenarios are defined in this directory.

Tests are located in files ending with `_test.go` and the framework are located in the rest.

## Running integration tests locally

The easiest way to run tests locally is to use [act](https://github.com/nektos/act), a local GitHub Actions runner:

```
act pull_request -W .github/workflows/test-integration.yaml
```

Alternatively, the `docker run` command in each GitHub workflow file can be used.

## Running integration tests on GitHub Actions

Each test currently runs as a separate workflows in GitHub actions, to add new test, run
`go generate` inside `../cmd/gh-action-integration-generator/` and commit the result.
