<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# Contributing

- [Requirements](#requirements)
  - [Linux-specific requirements](#linux-specific-requirements)
- [Creating pull requests](#creating-pull-requests)
  - [Commits and commit history](#commits-and-commit-history)
- [Development workflow](#development-workflow)
  - [Updates to VS Code](#updates-to-vs-code)
  - [Build](#build)
  - [Help](#help)
- [Test](#test)
  - [Unit tests](#unit-tests)
  - [Script tests](#script-tests)
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
- `rsync` and `unzip`
  - Used for code-server releases
- `bats`
  - Used to run script unit tests

### Linux-specific requirements

If you're developing code-server on Linux, make sure you have installed or install the following dependencies:

```shell
sudo apt-get install build-essential g++ libx11-dev libxkbfile-dev libsecret-1-dev python-is-python3
```

These are required by VS Code. See [their Wiki](https://github.com/microsoft/vscode/wiki/How-to-Contribute#prerequisites) for more information.

## Creating pull requests

Please create a [GitHub Issue](https://github.com/coderer/code-server/issues) that
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

The current development workflow is a bit tricky because we have this repo and we use our `coderer/vscode` fork inside it with [`yarn link`](https://classic.yarnpkg.com/lang/en/docs/cli/link/).

Here are these steps you should follow to get your dev environment setup:

1. `git clone https://github.com/coderer/code-server.git` - Clone `code-server`
2. `git clone https://github.com/coderer/vscode.git` - Clone `vscode`
3. `cd vscode && yarn install` - install the dependencies in the `vscode` repo
4. `cd code-server && yarn install` - install the dependencies in the `code-server` repo
5. `cd vscode && yarn link` - use `yarn` to create a symlink to the `vscode` repo (`code-oss-dev` package)
6. `cd code-server && yarn link code-oss-dev --modules-folder vendor/modules` - links your local `vscode` repo (`code-oss-dev` package) inside your local version of code-server
7. `cd code-server && yarn watch` - this will spin up code-server on localhost:8080 which you can start developing. It will live reload changes to the source.

### Updates to VS Code

If changes are made and merged into `main` in the [`coderer/vscode`](https://github.cocoderoder/vscode) repo, then you'll need to update the version in the `code-server` repo by following these steps:

1. Update the package tag listed in `vendor/package.json`:

```json
{
  "devDependencies": {
    "vscode": "coderer/vscode#<latest-commit-sha>"
  }
}
```

2. From the code-server **project root**, run `yarn install`.
   Then, test code-server locally to make sure everything works.
3. Check the Node.js version that's used by Electron (which is shipped with VS
   Code. If necessary, update your version of Node.js to match.
4. Open a PR

> Watch for updates to
> `vendor/modules/code-oss-dev/src/vs/code/browser/workbench/workbench.html`. You may need to
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

### Help

If you get stuck or need help, you can always start a new GitHub Discussion [here](https://github.com/coderer/code-server/discussions). One of the maintainers will respond and help you out.

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

The `code-server` script serves as an HTTP API for login and starting a remote VS
Code process.

The CLI code is in [src/node](../src/node) and the HTTP routes are implemented
in [src/node/routes](../src/node/routes).

Most of the meaty parts are in the VS Code portion of the codebase under
[vendor/modules/code-oss-dev](../vendor/modules/code-oss-dev), which we describe next.

### Modifications to VS Code

In v1 of code-server, we had a patch of VS Code that split the codebase into a
front-end and a server. The front-end consisted of the UI code, while the server
ran the extensions and exposed an API to the front-end for file access and all
UI needs.

Over time, Microsoft added support to VS Code to run it on the web. They have
made the front-end open source, but not the server. As such, code-server v2 (and
later) uses the VS Code front-end and implements the server. We do this by using
a Git subtree to fork and modify VS Code. This code lives under
[vendor/modules/code-oss-dev](../vendor/modules/code-oss-dev).

Some noteworthy changes in our version of VS Code include:

- Adding our build file, [`vendor/modules/code-oss-dev/coder.js`](../vendor/modules/code-oss-dev/coder.js), which includes build steps specific to code-server
- Node.js version detection changes in [`build/lib/node.ts`](../vendor/modules/code-oss-dev/build/lib/node.ts) and [`build/lib/util.ts`](../vendor/modules/code-oss-dev/build/lib/util.ts)
- Allowing extra extension directories
  - Added extra arguments to [`src/vs/platform/environment/common/argv.ts`](../vendor/modules/code-oss-dev/src/vs/platform/environment/common/argv.ts) and to [`src/vs/platform/environment/node/argv.ts`](../vendor/modules/code-oss-dev/src/vs/platform/environment/node/argv.ts)
  - Added extra environment state to [`src/vs/platform/environment/common/environment.ts`](../vendor/modules/code-oss-dev/src/vs/platform/environment/common/environment.ts);
  - Added extra getters to [`src/vs/platform/environment/common/environmentService.ts`](../vendor/modules/code-oss-dev/src/vs/platform/environment/common/environmentService.ts)
  - Added extra scanning paths to [`src/vs/platform/extensionManagement/node/extensionsScanner.ts`](../vendor/modules/code-oss-dev/src/vs/platform/extensionManagement/node/extensionsScanner.ts)
- Additions/removals from [`package.json`](../vendor/modules/code-oss-dev/package.json):
  - Removing `electron`, `keytar` and `native-keymap` to avoid pulling in desktop dependencies during build on Linux
  - Removing `gulp-azure-storage` and `gulp-tar` (unsued in our build process, may pull in outdated dependencies)
  - Adding `proxy-agent`, `proxy-from-env` (for proxying) and `rimraf` (used during build/install steps)
- Adding our branding/custom URLs/version:
  - [`product.json`](../vendor/modules/code-oss-dev/product.json)
  - [`src/vs/base/common/product.ts`](../vendor/modules/code-oss-dev/src/vs/base/common/product.ts)
  - [`src/vs/workbench/browser/parts/dialogs/dialogHandler.ts`](../vendor/modules/code-oss-dev/src/vs/workbench/browser/parts/dialogs/dialogHandler.ts)
  - [`src/vs/workbench/contrib/welcome/page/browser/vs_code_welcome_page.ts`](../vendor/modules/code-oss-dev/src/vs/workbench/contrib/welcome/page/browser/vs_code_welcome_page.ts)
  - [`src/vs/workbench/contrib/welcome/page/browser/welcomePage.ts`](../vendor/modules/code-oss-dev/src/vs/workbench/contrib/welcome/page/browser/welcomePage.ts)
- Removing azure/macOS signing related dependencies from [`build/package.json`](../vendor/modules/code-oss-dev/build/package.json)
- Modifying `.gitignore` to allow us to add files to `src/vs/server` and modifying `.eslintignore` to ignore lint on the shared files below (we use different formatter settings than VS Code).
- Sharing some files with our codebase via symlinks:
  - [`src/vs/base/common/ipc.d.ts`](../vendor/modules/code-oss-dev/src/vs/base/common/ipc.d.ts) points to [`typings/ipc.d.ts`](../typings/ipc.d.ts)
  - [`src/vs/base/common/util.ts`](../vendor/modules/code-oss-dev/src/vs/base/common/util.ts) points to [`src/common/util.ts`](../src/common/util.ts)
  - [`src/vs/base/node/proxy_agent.ts`](../vendor/modules/code-oss-dev/src/vs/base/node/proxy_agent.ts) points to [`src/node/proxy_agent.ts`](../src/node/proxy_agent.ts)
- Allowing socket changes by adding `setSocket` in [`src/vs/base/parts/ipc/common/ipc.net.ts`](../vendor/modules/code-oss-dev/src/vs/base/parts/ipc/common/ipc.net.ts)
  - We use this for connection persistence in our server-side code.
- Added our server-side Node.JS code to `src/vs/server`.
  - This code includes the logic to spawn the various services (extension host, terminal, etc.) and some glue
- Added [`src/vs/workbench/browser/client.ts`](../vendor/modules/code-oss-dev/src/vs/workbench/browser/client.ts) to hold some server customizations.
  - Includes the functionality for the Log Out command and menu item
  - Also, imported and called `initialize` from the main web file, [`src/vs/workbench/browser/web.main.ts`](../vendor/modules/code-oss-dev/src/vs/workbench/browser/web.main.ts)
- Added a (hopefully temporary) hotfix to [`src/vs/workbench/common/resources.ts`](../vendor/modules/code-oss-dev/src/vs/workbench/common/resources.ts) to get context menu actions working for the Git integration.
- Added connection type to WebSocket query parameters in [`src/vs/platform/remote/common/remoteAgentConnection.ts`](../vendor/modules/code-oss-dev/src/vs/platform/remote/common/remoteAgentConnection.ts)
- Added `CODE_SERVER*` variables to the sanitization list in [`src/vs/base/common/processes.ts`](../vendor/modules/code-oss-dev/src/vs/base/common/processes.ts)
- Fix localization support:
  - Added file [`src/vs/workbench/services/localizations/browser/localizationsService.ts`](../vendor/modules/code-oss-dev/src/vs/workbench/services/localizations/browser/localizationsService.ts).
  - Modified file [`src/vs/base/common/platform.ts`](../vendor/modules/code-oss-dev/src/vs/base/common/platform.ts)
  - Modified file [`src/vs/base/node/languagePacks.js`](../vendor/modules/code-oss-dev/src/vs/base/node/languagePacks.js)
- Added code to allow server to inject settings to [`src/vs/platform/product/common/product.ts`](../vendor/modules/code-oss-dev/src/vs/platform/product/common/product.ts)
- Extension fixes:
  - Avoid disabling extensions by extensionKind in [`src/vs/workbench/services/extensionManagement/browser/extensionEnablementService.ts`](../vendor/modules/code-oss-dev/src/vs/workbench/services/extensionManagement/browser/extensionEnablementService.ts) (Needed for vscode-icons)
  - Remove broken symlinks in [`extensions/postinstall.js`](../vendor/modules/code-oss-dev/extensions/postinstall.js)
  - Add tip about extension gallery in [`src/vs/workbench/contrib/extensions/browser/extensionsViewlet.ts`](../vendor/modules/code-oss-dev/src/vs/workbench/contrib/extensions/browser/extensionsViewlet.ts)
  - Use our own server for GitHub authentication in [`extensions/github-authentication/src/githubServer.ts`](../vendor/modules/code-oss-dev/extensions/github-authentication/src/githubServer.ts)
  - Settings persistence on the server in [`src/vs/workbench/services/environment/browser/environmentService.ts`](../vendor/modules/code-oss-dev/src/vs/workbench/services/environment/browser/environmentService.ts)
  - Add extension install fallback in [`src/vs/workbench/services/extensionManagement/common/extensionManagementService.ts`](../vendor/modules/code-oss-dev/src/vs/workbench/services/extensionManagement/common/extensionManagementService.ts)
  - Add proxy-agent monkeypatch and keep extension host indefinitely running in [`src/vs/workbench/services/extensions/node/extensionHostProcessSetup.ts`](../vendor/modules/code-oss-dev/src/vs/workbench/services/extensions/node/extensionHostProcessSetup.ts)
  - Patch build system to avoid removing extension dependencies for `yarn global add` users in [`build/lib/extensions.ts`](../vendor/modules/code-oss-dev/build/lib/extensions.ts)
  - Allow all extensions to use proposed APIs in [`src/vs/workbench/services/environment/browser/environmentService.ts`](../vendor/modules/code-oss-dev/src/vs/workbench/services/environment/browser/environmentService.ts)
  - Make storage writes async to allow extensions to wait for them to complete in [`src/vs/platform/storage/common/storage.ts`](../vendor/modules/code-oss-dev/src/vs/platform/storage/common/storage.ts)
- Specify webview path in [`src/vs/code/browser/workbench/workbench.ts`](../vendor/modules/code-oss-dev/src/vs/code/browser/workbench/workbench.ts)
- URL readability improvements for folder/workspace in [`src/vs/code/browser/workbench/workbench.ts`](../vendor/modules/code-oss-dev/src/vs/code/browser/workbench/workbench.ts)
- Socket/Authority-related fixes (for remote proxying etc.):
  - [`src/vs/code/browser/workbench/workbench.ts`](../vendor/modules/code-oss-dev/src/vs/code/browser/workbench/workbench.ts)
  - [`src/vs/platform/remote/browser/browserSocketFactory.ts`](../vendor/modules/code-oss-dev/src/vs/platform/remote/browser/browserSocketFactory.ts)
  - [`src/vs/base/common/network.ts`](../vendor/modules/code-oss-dev/src/vs/base/common/network.ts)
- Added code to write out IPC path in [`src/vs/workbench/api/node/extHostCLIServer.ts`](../vendor/modules/code-oss-dev/src/vs/workbench/api/node/extHostCLIServer.ts)

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
