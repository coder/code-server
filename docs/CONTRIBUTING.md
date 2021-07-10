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
- [Testing](#testing)
  - [Unit Tests](#unit-tests)
  - [Integration Tests](#integration-tests)
  - [End-to-End Tests](#end-to-end-tests)
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

- `node` v14.x
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

## Testing

There are three kinds of tests in code-server:

1. unit tests
2. integration tests
3. end-to-end tests

### Unit Tests

Our unit tests are written in TypeScript and run using [Jest, the testing framework](https://jestjs.io/).

These live under [test/unit](../test/unit).

We use unit tests for functions and things that can be tested in isolation.

### Integration Tests

These are a work-in-progress. We build code-server and run a script called [test-standalone-release.sh`](../ci/build/test-standalone-release.sh)
which ensures that code-server's CLI is working.

Integration for us means testing things that integrate and rely on each other. For instance, testing the CLI which requires that code-server be built and packaged.

### End-to-End Tests

The end-to-end (e2e) are written in TypeScript and run using [Playwright](https://playwright.dev/).

These live under [test/e2e](../test/e2e).

Before the e2e tests run, we have a `globalSetup` that runs which makes it so you don't have to login before each test and can reuse the authentication state.

Take a look at `codeServer.test.ts` to see how you use it (look at `test.use`).

We also have a model where you can create helpers to use within tests. Take a look at [models/CodeServer.ts](../test/e2e/models/CodeServer.ts) to see an example.

Generally speaking, e2e means testing code-server running in the browser, similar to how a user would interact with it. When running these tests with `yarn test:e2e`, you must have code-server running locally. In CI, this is taken care of for you.

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

- Adding our build file, [`lib/vscode/coder.js`](../lib/vscode/coder.js), which includes build steps specific to code-server
- Node.js version detection changes in [`build/lib/node.ts`](../lib/vscode/build/lib/node.ts) and [`build/lib/util.ts`](../lib/vscode/build/lib/util.ts)
- Allowing extra extension directories
  - Added extra arguments to [`src/vs/platform/environment/common/argv.ts`](../lib/vscode/src/vs/platform/environment/common/argv.ts) and to [`src/vs/platform/environment/node/argv.ts`](../lib/vscode/src/vs/platform/environment/node/argv.ts)
  - Added extra environment state to [`src/vs/platform/environment/common/environment.ts`](../lib/vscode/src/vs/platform/environment/common/environment.ts);
  - Added extra getters to [`src/vs/platform/environment/common/environmentService.ts`](../lib/vscode/src/vs/platform/environment/common/environmentService.ts)
  - Added extra scanning paths to [`src/vs/platform/extensionManagement/node/extensionsScanner.ts`](../lib/vscode/src/vs/platform/extensionManagement/node/extensionsScanner.ts)
- Additions/removals from [`package.json`](../lib/vscode/package.json):
  - Removing `electron`, `keytar` and `native-keymap` to avoid pulling in desktop dependencies during build on Linux
  - Removing `gulp-azure-storage` and `gulp-tar` (unsued in our build process, may pull in outdated dependencies)
  - Adding `proxy-agent`, `proxy-from-env` (for proxying) and `rimraf` (used during build/install steps)
- Adding our branding/custom URLs/version:
  - [`product.json`](../lib/vscode/product.json)
  - [`src/vs/base/common/product.ts`](../lib/vscode/src/vs/base/common/product.ts)
  - [`src/vs/workbench/browser/parts/dialogs/dialogHandler.ts`](../lib/vscode/src/vs/workbench/browser/parts/dialogs/dialogHandler.ts)
  - [`src/vs/workbench/contrib/welcome/page/browser/vs_code_welcome_page.ts`](../lib/vscode/src/vs/workbench/contrib/welcome/page/browser/vs_code_welcome_page.ts)
  - [`src/vs/workbench/contrib/welcome/page/browser/welcomePage.ts`](../lib/vscode/src/vs/workbench/contrib/welcome/page/browser/welcomePage.ts)
- Removing azure/macOS signing related dependencies from [`build/package.json`](../lib/vscode/build/package.json)
- Modifying `.gitignore` to allow us to add files to `src/vs/server` and modifying `.eslintignore` to ignore lint on the shared files below (we use different formatter settings than VS Code).
- Sharing some files with our codebase via symlinks:
  - [`src/vs/base/common/ipc.d.ts`](../lib/vscode/src/vs/base/common/ipc.d.ts) points to [`typings/ipc.d.ts`](../typings/ipc.d.ts)
  - [`src/vs/base/common/util.ts`](../lib/vscode/src/vs/base/common/util.ts) points to [`src/common/util.ts`](../src/common/util.ts)
  - [`src/vs/base/node/proxy_agent.ts`](../lib/vscode/src/vs/base/node/proxy_agent.ts) points to [`src/node/proxy_agent.ts`](../src/node/proxy_agent.ts)
- Allowing socket changes by adding `setSocket` in [`src/vs/base/parts/ipc/common/ipc.net.ts`](../lib/vscode/src/vs/base/parts/ipc/common/ipc.net.ts)
  - We use this for connection persistence in our server-side code.
- Added our server-side Node.JS code to `src/vs/server`.
  - This code includes the logic to spawn the various services (extension host, terminal, etc.) and some glue
- Added [`src/vs/workbench/browser/client.ts`](../lib/vscode/src/vs/workbench/browser/client.ts) to hold some server customizations.
  - Includes the functionality for the Log Out command and menu item
  - Also, imported and called `initialize` from the main web file, [`src/vs/workbench/browser/web.main.ts`](../lib/vscode/src/vs/workbench/browser/web.main.ts)
- Added a (hopefully temporary) hotfix to [`src/vs/workbench/common/resources.ts`](../lib/vscode/src/vs/workbench/common/resources.ts) to get context menu actions working for the Git integration.
- Added connection type to WebSocket query parameters in [`src/vs/platform/remote/common/remoteAgentConnection.ts`](../lib/vscode/src/vs/platform/remote/common/remoteAgentConnection.ts)
- Added `CODE_SERVER*` variables to the sanitization list in [`src/vs/base/common/processes.ts`](../lib/vscode/src/vs/base/common/processes.ts)
- Fix localization support:
  - Added file [`src/vs/workbench/services/localizations/browser/localizationsService.ts`](../lib/vscode/src/vs/workbench/services/localizations/browser/localizationsService.ts).
  - Modified file [`src/vs/base/common/platform.ts`](../lib/vscode/src/vs/base/common/platform.ts)
  - Modified file [`src/vs/base/node/languagePacks.js`](../lib/vscode/src/vs/base/node/languagePacks.js)
- Added code to allow server to inject settings to [`src/vs/platform/product/common/product.ts`](../lib/vscode/src/vs/platform/product/common/product.ts)
- Extension fixes:
  - Avoid disabling extensions by extensionKind in [`src/vs/workbench/services/extensionManagement/browser/extensionEnablementService.ts`](../lib/vscode/src/vs/workbench/services/extensionManagement/browser/extensionEnablementService.ts) (Needed for vscode-icons)
  - Remove broken symlinks in [`extensions/postinstall.js`](../lib/vscode/extensions/postinstall.js)
  - Add tip about extension gallery in [`src/vs/workbench/contrib/extensions/browser/extensionsViewlet.ts`](../lib/vscode/src/vs/workbench/contrib/extensions/browser/extensionsViewlet.ts)
  - Use our own server for GitHub authentication in [`extensions/github-authentication/src/githubServer.ts`](../lib/vscode/extensions/github-authentication/src/githubServer.ts)
  - Settings persistence on the server in [`src/vs/workbench/services/environment/browser/environmentService.ts`](../lib/vscode/src/vs/workbench/services/environment/browser/environmentService.ts)
  - Add extension install fallback in [`src/vs/workbench/services/extensionManagement/common/extensionManagementService.ts`](../lib/vscode/src/vs/workbench/services/extensionManagement/common/extensionManagementService.ts)
  - Add proxy-agent monkeypatch and keep extension host indefinitely running in [`src/vs/workbench/services/extensions/node/extensionHostProcessSetup.ts`](../lib/vscode/src/vs/workbench/services/extensions/node/extensionHostProcessSetup.ts)
  - Patch build system to avoid removing extension dependencies for `yarn global add` users in [`build/lib/extensions.ts`](../lib/vscode/build/lib/extensions.ts)
  - Allow all extensions to use proposed APIs in [`src/vs/workbench/services/environment/browser/environmentService.ts`](../lib/vscode/src/vs/workbench/services/environment/browser/environmentService.ts)
  - Make storage writes async to allow extensions to wait for them to complete in [`src/vs/platform/storage/common/storage.ts`](../lib/vscode/src/vs/platform/storage/common/storage.ts)
- Specify webview path in [`src/vs/code/browser/workbench/workbench.ts`](../lib/vscode/src/vs/code/browser/workbench/workbench.ts)
- URL readability improvements for folder/workspace in [`src/vs/code/browser/workbench/workbench.ts`](../lib/vscode/src/vs/code/browser/workbench/workbench.ts)
- Socket/Authority-related fixes (for remote proxying etc.):
  - [`src/vs/code/browser/workbench/workbench.ts`](../lib/vscode/src/vs/code/browser/workbench/workbench.ts)
  - [`src/vs/platform/remote/browser/browserSocketFactory.ts`](../lib/vscode/src/vs/platform/remote/browser/browserSocketFactory.ts)
  - [`src/vs/base/common/network.ts`](../lib/vscode/src/vs/base/common/network.ts)
- Added code to write out IPC path in [`src/vs/workbench/api/node/extHostCLIServer.ts`](../lib/vscode/src/vs/workbench/api/node/extHostCLIServer.ts)

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
