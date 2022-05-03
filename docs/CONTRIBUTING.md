<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# Contributing

- [Requirements](#requirements)
  - [Linux-specific requirements](#linux-specific-requirements)
- [Creating pull requests](#creating-pull-requests)
  - [Commits and commit history](#commits-and-commit-history)
- [Development workflow](#development-workflow)
  - [Version updates to Code](#version-updates-to-code)
  - [Patching Code](#patching-code)
  - [Build](#build)
  - [Help](#help)
- [Test](#test)
  - [Unit tests](#unit-tests)
  - [Script tests](#script-tests)
  - [Integration tests](#integration-tests)
  - [End-to-end tests](#end-to-end-tests)
- [Structure](#structure)
  - [Modifications to Code](#modifications-to-code)
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
- [`git-lfs`](https://git-lfs.github.com)
- [`yarn`](https://classic.yarnpkg.com/en/)
  - Used to install JS packages and run scripts
- [`nfpm`](https://nfpm.goreleaser.com/)
  - Used to build `.deb` and `.rpm` packages
- [`jq`](https://stedolan.github.io/jq/)
  - Used to build code-server releases
- [`gnupg`](https://gnupg.org/index.html)
  - All commits must be signed and verified; see GitHub's [Managing commit
    signature
    verification](https://docs.github.com/en/github/authenticating-to-github/managing-commit-signature-verification)
    or follow [this tutorial](https://joeprevite.com/verify-commits-on-github)
- `quilt`
  - Used to manage patches to Code
- `rsync` and `unzip`
  - Used for code-server releases
- `bats`
  - Used to run script unit tests

### Linux-specific requirements

If you're developing code-server on Linux, make sure you have installed or install the following dependencies:

```shell
sudo apt-get install build-essential g++ libx11-dev libxkbfile-dev libsecret-1-dev python-is-python3
```

These are required by Code. See [their Wiki](https://github.com/microsoft/vscode/wiki/How-to-Contribute#prerequisites) for more information.

## Creating pull requests

Please create a [GitHub Issue](https://github.com/coder/code-server/issues) that
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

1. `git clone https://github.com/coder/code-server.git` - Clone `code-server`
2. `git submodule update --init` - Clone `vscode` submodule
3. `quilt push -a` - Apply patches to the `vscode` submodule.
4. `yarn` - Install dependencies
5. `yarn watch` - Launch code-server localhost:8080. code-server will be live
   reloaded when changes are made; the browser needs to be refreshed manually.

When pulling down changes that include modifications to the patches you will
need to apply them with `quilt`. If you pull down changes that update the
`vscode` submodule you will need to run `git submodule update --init` and
re-apply the patches.

### Version updates to Code

1. Update the `lib/vscode` submodule to the desired upstream version branch.
   1. `cd lib/vscode && git checkout release/1.66 && cd ../..`
   2. `git add lib && git commit -m "chore: update Code"`
2. Apply the patches (`quilt push -a`) or restore your stashed changes. At this
   stage you may need to resolve conflicts. For example use `quilt push -f`,
   manually apply the rejected portions, then `quilt refresh`.
3. From the code-server **project root**, run `yarn install`.
4. Test code-server locally to make sure everything works.
5. Check the Node.js version that's used by Electron (which is shipped with VS
   Code. If necessary, update your version of Node.js to match.
6. Commit the updated submodule and patches to `code-server`.
7. Open a PR.

### Patching Code

0. You can go through the patch stack with `quilt push` and `quilt pop`.
1. Create a new patch (`quilt new {name}.diff`) or use an existing patch.
2. Add the file(s) you are patching (`quilt add [-P patch] {file}`). A file
   **must** be added before you make changes to it.
3. Make your changes. Patches do not need to be independent of each other but
   each patch must result in a working code-server without any broken in-between
   states otherwise they are difficult to test and modify.
4. Add your changes to the patch (`quilt refresh`)
5. Add a comment in the patch about the reason for the patch and how to
   reproduce the behavior it fixes or adds. Every patch should have an e2e test
   as well.

### Build

You can build as follows:

```shell
yarn build
yarn build:vscode
yarn release
```

_NOTE: this does not keep `node_modules`. If you want them to be kept, use `KEEP_MODULES=1 yarn release` (if you're testing in Coder, you'll want to do this)_

Run your build:

```shell
cd release
yarn --production # Skip if you used KEEP_MODULES=1
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

### Help

If you get stuck or need help, you can always start a new GitHub Discussion [here](https://github.com/coder/code-server/discussions). One of the maintainers will respond and help you out.

## Test

There are four kinds of tests in code-server:

1. Unit tests
2. Script tests
3. Integration tests
4. End-to-end tests

### Unit tests

Our unit tests are written in TypeScript and run using
[Jest](https://jestjs.io/), the testing framework].

These live under [test/unit](../test/unit).

We use unit tests for functions and things that can be tested in isolation. The file structure is modeled closely after `/src` so it's easy for people to know where test files should live.

### Script tests

Our script tests are written in bash and run using [bats](https://github.com/bats-core/bats-core).

These tests live under `test/scripts`.

We use these to test anything related to our scripts (most of which live under `ci`).

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

The `code-server` script serves as an HTTP API for login and starting a remote
Code process.

The CLI code is in [src/node](../src/node) and the HTTP routes are implemented
in [src/node/routes](../src/node/routes).

Most of the meaty parts are in the Code portion of the codebase under
[lib/vscode](../lib/vscode), which we describe next.

### Modifications to Code

Our modifications to Code can be found in the [patches](../patches) directory.
We pull in Code as a submodule pointing to an upstream release branch.

In v1 of code-server, we had Code as a submodule and used a single massive patch
that split the codebase into a front-end and a server. The front-end consisted
of the UI code, while the server ran the extensions and exposed an API to the
front-end for file access and all UI needs.

Over time, Microsoft added support to Code to run it on the web. They had made
the front-end open source, but not the server. As such, code-server v2 (and
later) uses the Code front-end and implements the server. We did this by using a
Git subtree to fork and modify Code.

Microsoft eventually made the server open source and we were able to reduce our
changes significantly. Some time later we moved back to a submodule and patches
(managed by `quilt` this time instead of the mega-patch).

As the web portion of Code continues to mature, we'll be able to shrink and
possibly eliminate our patches. In the meantime, upgrading the Code version
requires us to ensure that our changes are still applied correctly and work as
intended. In the future, we'd like to run Code unit tests against our builds to
ensure that features work as expected.

> We have [extension docs](../ci/README.md) on the CI and build system.

If the functionality you're working on does NOT depend on code from Code, please
move it out and into code-server.

### Currently Known Issues

- Creating custom Code extensions and debugging them doesn't work
- Extension profiling and tips are currently disabled
