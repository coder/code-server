<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# Contributing

- [Requirements](#requirements)
- [Creating pull requests](#creating-pull-requests)
  - [Commits and commit history](#commits-and-commit-history)
- [Development workflow](#development-workflow)
  - [Updates to VS Code](#updates-to-vs-code)
  - [Build](#build)
  - [Test](#test)
  - [Unit tests](#unit-tests)
  - [Integration tests](#integration-tests)
  - [End-to-end tests](#end-to-end-tests)
- [Structure](#structure)
  - [Modifications to VS Code](#modifications-to-vs-code)
  - [Currently Known Issues](#currently-known-issues)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

- [Detailed CI and build process docs](../ci)

## Requirements

The prerequisites for contributing to code-server are almost the same as those
for [VS
Code](https://github.com/Microsoft/vscode/wiki/How-to-Contribute#prerequisites).
Here is what is needed:

- `node` v14.x
- `git` v2.x or greater
- [`yarn`](https://classic.yarnpkg.com/en/)
  - Used to install JS packages and run scripts
- [`nfpm`](https://classic.yarnpkg.com/en/)
  - Used to build `.deb` and `.rpm` packages
- [`jq`](https://stedolan.github.io/jq/)
  - Used to build code-server releases
- [`gnupg`](https://gnupg.org/index.html)
  - All commits must be signed and verified; see GitHub's [Managing commit
    signature
    verification](https://docs.github.com/en/github/authenticating-to-github/managing-commit-signature-verification)
    or follow [this tutorial](https://joeprevite.com/verify-commits-on-github)
- `build-essential` (Linux only - used by VS Code)
  - Get this by running `apt-get install -y build-essential`
- `rsync` and `unzip`
  - Used for code-server releases

## Creating pull requests

Please create a [GitHub Issue](https://github.com/cdr/code-server/issues) that
includes context for issues that you see. You can skip this if the proposed fix
is minor.

In your pull requests (PR), link to the issue that the PR solves.

Please ensure that the base of your PR is the **main** branch.

### Commits and commit history

We prefer a clean commit history. This means you should squash all fixups and
fixup-type commits before asking for a review (e.g., clean up, squash, then force
push). If you need help with this, feel free to leave a comment in your PR, and
we'll guide you.

## Development workflow

```shell
yarn
yarn watch
# Visit http://localhost:8080 once the build is completed.
```

`yarn watch` will live reload changes to the source.

### Updates to VS Code

Updating VS Code requires `git subtree`. On some RPM-based Linux distros, `git subtree` is not included by default and needs to be installed separately. To
install, run `dnf install git-subtree` or `yum install git-subtree`.

To update VS Code:

1. Run `yarn update:vscode`.
2. Enter a version (e.g., `1.53`)
3. This will open a draft pull request for you.
4. There will be merge conflicts. Commit them first, since it will be impossible
   for us to review your PR if you don't.
5. Fix the conflicts. Then, test code-server locally to make sure everything
   works.
6. Check the Node.js version that's used by Electron (which is shipped with VS
   Code. If necessary, update your version of Node.js to match.

> Watch for updates to
> `lib/vscode/src/vs/code/browser/workbench/workbench.html`. You may need to
> make changes to `src/browser/pages/vscode.html`.

### Build

You can build as follows:

```shell
yarn build
yarn build:vscode
yarn release
```

Run your build:

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

> On Linux, the currently running distro will become the minimum supported
> version. In our GitHub Actions CI, we use CentOS 7 for maximum compatibility.
> If you need your builds to support older distros, run the build commands
> inside a Docker container with all the build requirements installed.

### Test

There are three kinds of tests in code-server:

1. Unit tests
2. Integration tests
3. End-to-end tests

### Unit tests

Our unit tests are written in TypeScript and run using
[Jest](https://jestjs.io/), the testing framework].

These live under [test/unit](../test/unit).

We use unit tests for functions and things that can be tested in isolation.

### Integration tests

These are a work in progress. We build code-server and run a script called
[test-standalone-release.sh](../ci/build/test-standalone-release.sh), which
ensures that code-server's CLI is working.

Our integration tests look at components that rely on one another. For example,
testing the CLI requires us to build and package code-server.

### End-to-end tests

The end-to-end (e2e) tests are written in TypeScript and run using
[Playwright](https://playwright.dev/).

These live under [test/e2e](../test/e2e).

Before the e2e tests run, we run `globalSetup`, which eliminates the need to log
in before each test by preserving the authentication state.

Take a look at `codeServer.test.ts` to see how you would use it (see
`test.use`).

We also have a model where you can create helpers to use within tests. See
[models/CodeServer.ts](../test/e2e/models/CodeServer.ts) for an example.

Generally speaking, e2e means testing code-server while running in the browser
and interacting with it in a way that's similar to how a user would interact
with it. When running these tests with `yarn test:e2e`, you must have
code-server running locally. In CI, this is taken care of for you.

## Structure

The `code-server` script serves as an HTTP API for login and starting a remote VS
Code process.

The CLI code is in [src/node](../src/node) and the HTTP routes are implemented
in [src/node/routes](../src/node/routes).

Most of the meaty parts are in the VS Code portion of the codebase under
[lib/vscode](../lib/vscode), which we describe next.

### Modifications to VS Code

In v1 of code-server, we had a patch of VS Code that split the codebase into a
front-end and a server. The front-end consisted of the UI code, while the server
ran the extensions and exposed an API to the front-end for file access and all
UI needs.

Over time, Microsoft added support to VS Code to run it on the web. They have
made the front-end open source, but not the server. As such, code-server v2 (and
later) uses the VS Code front-end and implements the server. We do this by using
a Git subtree to fork and modify VS Code. This code lives under
[lib/vscode](../lib/vscode).

Some noteworthy changes in our version of VS Code include:

- Adding our build file, which includes our code and VS Code's web code
- Allowing multiple extension directories (both user and built-in)
- Modifying the loader, WebSocket, webview, service worker, and asset requests to
  use the URL of the page as a base (and TLS, if necessary for the WebSocket)
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

> We have [extension docs](../ci/README.md) on the CI and build system.

If the functionality you're working on does NOT depend on code from VS Code, please
move it out and into code-server.

### Currently Known Issues

- Creating custom VS Code extensions and debugging them doesn't work
- Extension profiling and tips are currently disabled
