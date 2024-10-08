<!-- prettier-ignore-start -->
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# Contributing

- [Requirements](#requirements)
  - [Linux-specific requirements](#linux-specific-requirements)
- [Development workflow](#development-workflow)
  - [Version updates to Code](#version-updates-to-code)
  - [Patching Code](#patching-code)
  - [Build](#build)
    - [Creating a Standalone Release](#creating-a-standalone-release)
  - [Troubleshooting](#troubleshooting)
    - [I see "Forbidden access" when I load code-server in the browser](#i-see-forbidden-access-when-i-load-code-server-in-the-browser)
    - ["Can only have one anonymous define call per script"](#can-only-have-one-anonymous-define-call-per-script)
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
<!-- prettier-ignore-end -->

## Requirements

The prerequisites for contributing to code-server are almost the same as those
for [VS Code](https://github.com/Microsoft/vscode/wiki/How-to-Contribute#prerequisites).
Here is what is needed:

- `node` v20.x
- `git` v2.x or greater
- [`git-lfs`](https://git-lfs.github.com)
- [`npm`](https://www.npmjs.com/)
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

If you're developing code-server on Linux, make sure you have installed or
install the following dependencies:

```shell
sudo apt-get install build-essential g++ libx11-dev libxkbfile-dev libsecret-1-dev libkrb5-dev python-is-python3
```

These are required by Code. See [their Wiki](https://github.com/microsoft/vscode/wiki/How-to-Contribute#prerequisites)
for more information.

## Development workflow

1. `git clone https://github.com/coder/code-server.git` - Clone `code-server`
2. `git submodule update --init` - Clone `vscode` submodule
3. `quilt push -a` - Apply patches to the `vscode` submodule.
4. `npm install` - Install dependencies
5. `npm run watch` - Launch code-server localhost:8080. code-server will be live
   reloaded when changes are made; the browser needs to be refreshed manually.

When pulling down changes that include modifications to the patches you will
need to apply them with `quilt`. If you pull down changes that update the
`vscode` submodule you will need to run `git submodule update --init` and
re-apply the patches.

When you make a change that affects people deploying the marketplace please
update the changelog as part of your PR.

Note that building code-server takes a very, very long time, and loading it in
the browser in development mode also takes a very, very long time.

Display language (Spanish, etc) support only works in a full build; it will not
work in development mode.

Generally we prefer that PRs be squashed into `main` but you can rebase or merge
if it is important to keep the individual commits (make sure to clean up the
commits first if you are doing this).

### Version updates to Code

1. Remove any patches with `quilt pop -a`.
2. Update the `lib/vscode` submodule to the desired upstream version branch.
   1. `cd lib/vscode && git checkout release/1.66 && cd ../..`
   2. `git add lib && git commit -m "chore: update to Code <version>"`
3. Apply the patches one at a time (`quilt push`). If the application succeeds
   but the lines changed, update the patch with `quilt refresh`. If there are
   conflicts, then force apply with `quilt push -f`, manually add back the
   rejected code, then run `quilt refresh`.
4. From the code-server **project root**, run `npm install`.
5. Check the Node.js version that's used by Electron (which is shipped with VS
   Code. If necessary, update our version of Node.js to match.

### Patching Code

1. You can go through the patch stack with `quilt push` and `quilt pop`.
2. Create a new patch (`quilt new {name}.diff`) or use an existing patch.
3. Add the file(s) you are patching (`quilt add [-P patch] {file}`). A file
   **must** be added before you make changes to it.
4. Make your changes. Patches do not need to be independent of each other but
   each patch must result in a working code-server without any broken in-between
   states otherwise they are difficult to test and modify.
5. Add your changes to the patch (`quilt refresh`)
6. Add a comment in the patch about the reason for the patch and how to
   reproduce the behavior it fixes or adds. Every patch should have an e2e test
   as well.

### Build

You can build a full production as follows:

```shell
git submodule update --init
quilt push -a
npm install
npm run build
VERSION=0.0.0 npm run build:vscode
npm run release
```

This does not keep `node_modules`. If you want them to be kept, use
`KEEP_MODULES=1 npm run release`

Run your build:

```shell
cd release
npm install --omit=dev # Skip if you used KEEP_MODULES=1
# Runs the built JavaScript with Node.
node .
```

Then, to build the release package:

```shell
npm run release:standalone
npm run test:integration
npm run package
```

> On Linux, the currently running distro will become the minimum supported
> version. In our GitHub Actions CI, we use CentOS 8 for maximum compatibility.
> If you need your builds to support older distros, run the build commands
> inside a Docker container with all the build requirements installed.

#### Creating a Standalone Release

Part of the build process involves creating standalone releases. At the time of
writing, we do this for the following platforms/architectures:

- Linux amd64 (.tar.gz, .deb, and .rpm)
- Linux arm64 (.tar.gz, .deb, and .rpm)
- Linux arm7l (.tar.gz)
- Linux armhf.deb
- Linux armhf.rpm
- macOS arm64.tar.gz

Currently, these are compiled in CI using the `npm run release:standalone`
command in the `release.yaml` workflow. We then upload them to the draft release
and distribute via GitHub Releases.

### Troubleshooting

#### I see "Forbidden access" when I load code-server in the browser

This means your patches didn't apply correctly. We have a patch to remove the
auth from vanilla Code because we use our own.

Try popping off the patches with `quilt pop -a` and reapplying with `quilt push
-a`.

#### "Can only have one anonymous define call per script"

Code might be trying to use a dev or prod HTML in the wrong context. You can try
re-running code-server and setting `VSCODE_DEV=1`.

### Help

If you get stuck or need help, you can always start a new GitHub Discussion
[here](https://github.com/coder/code-server/discussions). One of the maintainers
will respond and help you out.

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

We use unit tests for functions and things that can be tested in isolation. The
file structure is modeled closely after `/src` so it's easy for people to know
where test files should live.

### Script tests

Our script tests are written in bash and run using [bats](https://github.com/bats-core/bats-core).

These tests live under `test/scripts`.

We use these to test anything related to our scripts (most of which live under
`ci`).

### Integration tests

These are a work in progress. We build code-server and run tests with `npm run
test:integration`, which ensures that code-server builds work on their
respective platforms.

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

## Structure

code-server essentially serves as an HTTP API for logging in and starting a
remote Code process.

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
