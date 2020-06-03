<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# Contributing

- [Requirements](#requirements)
- [Development Workflow](#development-workflow)
- [Build](#build)
- [Structure](#structure)
  - [VS Code Patch](#vs-code-patch)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

- [Detailed CI and build process docs](../ci)

## Requirements

Please refer to [VS Code's prerequisites](https://github.com/Microsoft/vscode/wiki/How-to-Contribute#prerequisites).

Differences:

- We require a minimum of node v12 but later versions should work.
- We use [fnpm](https://github.com/goreleaser/nfpm) to build `.deb` and `.rpm` packages.
- We use [jq](https://stedolan.github.io/jq/) to build code-server releases.
- The [CI container](../ci/images/debian8/Dockerfile) is a useful reference for all our dependencies.

## Development Workflow

```shell
yarn
yarn vscode
yarn watch
# Visit http://localhost:8080 once the build completed.
```

To develop inside of an isolated docker container:

```shell
./ci/dev/image/exec.sh

root@12345:/code-server# yarn
root@12345:/code-server# yarn vscode
root@12345:/code-server# yarn watch
```

Any changes made to the source will be live reloaded.

If changes are made to the patch and you've built previously you must manually
reset VS Code then run `yarn vscode:patch`.

## Build

```shell
yarn
yarn vscode
yarn build
yarn build:vscode
yarn release
cd release
yarn --production
# Runs the built JavaScript with Node.
node .
```

Now you can build release packages with:

```
yarn release:standalone
# The standalone release is in ./release-standalone
yarn test:standalone-release
yarn package
# .deb, .rpm and the standalone archive are in ./release-packages
```

## Structure

The `code-server` script serves an HTTP API to login and start a remote VS Code process.

The CLI code is in [./src/node](./src/node) and the HTTP routes are implemented in
[./src/node/app](./src/node/app).

Most of the meaty parts are in our VS Code patch which is described next.

### VS Code Patch

Back in v1 of code-server, we had an extensive patch of VS Code that split the codebase
into a frontend and server. The frontend consisted of all UI code and the server ran
the extensions and exposed an API to the frontend for file access and everything else
that the UI needed.

This worked but eventually Microsoft added support to VS Code to run it in the web.
They have open sourced the frontend but have kept the server closed source.

So in interest of piggy backing off their work, v2 and beyond use the VS Code
web frontend and fill in the server. This is contained in our
[./ci/dev/vscode.patch](../ci/dev/vscode.patch) under the path `src/vs/server`.

Other notable changes in our patch include:

- Add our own build file which includes our code and VS Code's web code.
- Allow multiple extension directories (both user and built-in).
- Modify the loader, websocket, webview, service worker, and asset requests to
  use the URL of the page as a base (and TLS if necessary for the websocket).
- Send client-side telemetry through the server.
- Allow modification of the display language.
- Make it possible for us to load code on the client.
- Make extensions work in the browser.
- Make it possible to install extensions of any kind.
- Fix getting permanently disconnected when you sleep or hibernate for a while.
- Add connection type to web socket query parameters.

Some known issues presently:

- Creating custom VS Code extensions and debugging them doesn't work.
- Extension profiling and tips are currently disabled.

As the web portion of VS Code matures, we'll be able to shrink and maybe even entirely
eliminate our patch. In the meantime, however, upgrading the VS Code version requires
ensuring that the patch still applies and has the intended effects.

To generate a new patch run `yarn vscode:diff`.

**note**: We have extension docs on the CI and build system at [./ci/README.md](../ci/README.md)

If functionality doesn't depend on code from VS Code then it should be moved
into code-server otherwise it should be in the patch.

In the future we'd like to run VS Code unit tests against our builds to ensure features
work as expected.
