<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# Contributing

- [Pull Requests](#pull-requests)
  - [Commits](#commits)
- [Requirements](#requirements)
- [Development Workflow](#development-workflow)
  - [Updating VS Code](#updating-vs-code)
    - [Notes about Changes](#notes-about-changes)
- [Build](#build)
- [Structure](#structure)
  - [Modifications to VS Code](#modifications-to-vs-code)
  - [Currently Known Issues](#currently-known-issues)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

- [Detailed CI and build process docs](../ci)

## Pull Requests

Please create a [GitHub Issue](https://github.com/cdr/code-server/issues) to address any issue. You can skip this if the proposed fix is minor.

In your Pull Requests (PR), link to the issue that the PR solves.

Please ensure that the base of your PR is the **main** branch.

### Commits

We prefer a clean commit history. This means you should squash all fixups and fixup-type commits before asking for review (cleanup, squash, force-push). If you need help with this, feel free to leave a comment in your PR and we'll guide you.

## Requirements

The prerequisites for contributing to code-server are almost the same as those for
[VS Code](https://github.com/Microsoft/vscode/wiki/How-to-Contribute#prerequisites).
There are several differences, however. Here is what is needed:

- `node` v14.x or greater
- `git` v2.x or greater
- [`yarn`](https://classic.yarnpkg.com/en/)
  - used to install JS packages and run scripts
- [`nfpm`](https://classic.yarnpkg.com/en/)
  - used to build `.deb` and `.rpm` packages
- [`jq`](https://stedolan.github.io/jq/)
  - used to build code-server releases
- [`gnupg`](https://gnupg.org/index.html)
  - all commits must be signed and verified
  - see GitHub's ["Managing commit signature verification"](https://docs.github.com/en/github/authenticating-to-github/managing-commit-signature-verification) or follow [this tutorial](https://joeprevite.com/verify-commits-on-github)
- `build-essential` (Linux)
  - `apt-get install -y build-essential` - used by VS Code
- `rsync` and `unzip`
  - used for code-server releases

## Development Workflow

```shell
yarn
yarn watch
# Visit http://localhost:8080 once the build is completed.
```

`yarn watch` will live reload changes to the source.

### Updating VS Code

Updating VS Code requires `git subtree`. On some rpm-based Linux distros, `git subtree` is not included by default, and needs to be installed separately.
To install, run `dnf install git-subtree` or `yum install git-subtree` as necessary.

To update VS Code, follow these steps:

1. Run `yarn update:vscode`.
2. Enter a version. Ex. 1.53
3. This will open a draft PR for you.
4. There will be merge conflicts. First commit them.
   1. We do this because if we don't, it will be impossible to review your PR.
5. Once they're all fixed, test code-server locally and make sure it all works.
6. Check the version of Node.js that the version of Electron shipped with VSCode uses, and update the version of Node.js if necessary.

#### Notes about Changes

- watch out for updates to `lib/vscode/src/vs/code/browser/workbench/workbench.html`. You may need to make changes to `src/browser/pages/vscode.html`

## Build

You can build using:

```shell
yarn build
yarn build:vscode
yarn release
```

Run your build with:

```shell
cd release
yarn --production
# Runs the built JavaScript with Node.
node .
```

Build the release packages (make sure that you run `yarn release` first):

```shell
yarn release:standalone
yarn test:standalone-release
yarn package
```

NOTE: On Linux, the currently running distro will become the minimum supported version.
In our GitHub Actions CI, we use CentOS 7 for maximum compatibility.
If you need your builds to support older distros, run the build commands
inside a Docker container with all the build requirements installed.

## Structure

The `code-server` script serves an HTTP API for login and starting a remote VS Code process.

The CLI code is in [src/node](../src/node) and the HTTP routes are implemented in
[src/node/routes](../src/node/routes).

Most of the meaty parts are in the VS Code portion of the codebase under [lib/vscode](../lib/vscode), which we described next.

### Modifications to VS Code

In v1 of code-server, we had a patch of VS Code that split the codebase into a front-end
and a server. The front-end consisted of all UI code, while the server ran the extensions
and exposed an API to the front-end for file access and all UI needs.

Over time, Microsoft added support to VS Code to run it on the web. They have made
the front-end open source, but not the server. As such, code-server v2 (and later) uses
the VS Code front-end and implements the server. We do this by using a git subtree to fork and modify VS Code. This code lives under [lib/vscode](../lib/vscode).

Some noteworthy changes in our version of VS Code:

- Adding our build file, which includes our code and VS Code's web code
- Allowing multiple extension directories (both user and built-in)
- Modifying the loader, websocket, webview, service worker, and asset requests to
  use the URL of the page as a base (and TLS, if necessary for the websocket)
- Sending client-side telemetry through the server
- Allowing modification of the display language
- Making it possible for us to load code on the client
- Making it possible to install extensions of any kind
- Fixing issue with getting disconnected when your machine sleeps or hibernates
- Adding connection type to web socket query parameters

As the web portion of VS Code matures, we'll be able to shrink and possibly
eliminate our modifications. In the meantime, upgrading the VS Code version requires
us to ensure that our changes are still applied and work as intended. In the future,
we'd like to run VS Code unit tests against our builds to ensure that features
work as expected.

**Note**: We have [extension docs](../ci/README.md) on the CI and build system.

If the functionality you're working on does NOT depend on code from VS Code, please
move it out and into code-server.

### Currently Known Issues

- Creating custom VS Code extensions and debugging them doesn't work
- Extension profiling and tips are currently disabled
