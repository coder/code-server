<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# Contributing

- [Pull Requests](#pull-requests)
- [Requirements](#requirements)
- [Development Workflow](#development-workflow)
- [Build](#build)
- [Structure](#structure)
  - [VS Code Patch](#vs-code-patch)
  - [Currently Known Issues](#currently-known-issues)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

- [Detailed CI and build process docs](../ci)

## Pull Requests

Please create a [GitHub Issue](https://github.com/cdr/code-server/issues) for each issue
you'd like to address unless the proposed fix is minor.

In your Pull Requests (PR), link to the issue that the PR solves.

Please ensure that the base of your PR is the **master** branch. (Note: The default
GitHub branch is the latest release branch, though you should point all of your changes to be merged into
master).

## Requirements

The prerequisites for contributing to code-server are almost the same as those for
[VS Code](https://github.com/Microsoft/vscode/wiki/How-to-Contribute#prerequisites).
There are several differences, however. You must:

- Use Node.js version 12.x (or greater)
- Have [nfpm](https://github.com/goreleaser/nfpm) (which is used to build `.deb` and `.rpm` packages and [jq](https://stedolan.github.io/jq/) (used to build code-server releases) installed

The [CI container](../ci/images/debian8/Dockerfile) is a useful reference for all
of the dependencies code-server uses.

## Development Workflow

```shell
yarn
yarn vscode
yarn watch
# Visit http://localhost:8080 once the build is completed.
```

To develop inside an isolated Docker container:

```shell
./ci/dev/image/run.sh yarn
./ci/dev/image/run.sh yarn vscode
./ci/dev/image/run.sh yarn watch
```

`yarn watch` will live reload changes to the source.

If you introduce changes to the patch and you've previously built, you
must (1) manually reset VS Code and (2) run `yarn vscode:patch`.

## Build

You can build using:

```shell
./ci/dev/image/run.sh ./ci/steps/release.sh
```

Run your build with:

```shell
cd release
yarn --production
# Runs the built JavaScript with Node.
node .
```

Build the release packages (make sure that you run `./ci/steps/release.sh` first):

```shell
IMAGE=centos7 ./ci/dev/image/run.sh ./ci/steps/release-packages.sh
# The standalone release is in ./release-standalone
# .deb, .rpm and the standalone archive are in ./release-packages
```

The `release.sh` script is equal to running:

```shell
yarn
yarn vscode
yarn build
yarn build:vscode
yarn release
```

And `release-packages.sh` is equal to:

```shell
yarn release:standalone
yarn test:standalone-release
yarn package
```

For a faster release build, you can run instead:

```shell
KEEP_MODULES=1 ./ci/steps/release.sh
node ./release
```

## Structure

The `code-server` script serves an HTTP API for login and starting a remote VS Code process.

The CLI code is in [./src/node](./src/node) and the HTTP routes are implemented in
[./src/node/app](./src/node/app).

Most of the meaty parts are in the VS Code patch, which we described next.

### VS Code Patch

In v1 of code-server, we had a patch of VS Code that split the codebase into a front-end
and a server. The front-end consisted of all UI code, while the server ran the extensions
and exposed an API to the front-end for file access and all UI needs.

Over time, Microsoft added support to VS Code to run it on the web. They have made
the front-end open source, but not the server. As such, code-server v2 (and later) uses
the VS Code front-end and implements the server. You can find this in
[./ci/dev/vscode.patch](../ci/dev/vscode.patch) under the path `src/vs/server`.

Other notable changes in our patch include:

- Adding our build file, which includes our code and VS Code's web code
- Allowing multiple extension directories (both user and built-in)
- Modifying the loader, websocket, webview, service worker, and asset requests to
  use the URL of the page as a base (and TLS, if necessary for the websocket)
- Sending client-side telemetry through the server
- Allowing modification of the display language
- Making it possible for us to load code on the client
- Making extensions work in the browser
- Making it possible to install extensions of any kind
- Fixing issue with getting disconnected when your machine sleeps or hibernates
- Adding connection type to web socket query parameters

As the web portion of VS Code matures, we'll be able to shrink and possibly
eliminate our patch. In the meantime, upgrading the VS Code version requires
us to ensure that the patch is applied and works as intended. In the future,
we'd like to run VS Code unit tests against our builds to ensure that features
work as expected.

To generate a new patch, run `yarn vscode:diff`

**Note**: We have [extension docs](../ci/README.md) on the CI and build system.

If the functionality you're working on does NOT depend on code from VS Code, please
move it out and into code-server.

### Currently Known Issues

- Creating custom VS Code extensions and debugging them doesn't work
- Extension profiling and tips are currently disabled
