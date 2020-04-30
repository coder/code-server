# ci

This directory contains scripts used for code-server's continuous integration infrastructure.

Many of these scripts contain more detailed documentation and options in comments at the top.

Any file and directory added into this tree should be documented here.

## dev

This directory contains scripts used for the development of code-server.

- [./dev/container](./dev/container)
  - See [CONTRIBUTING.md](../doc/CONTRIBUTING.md) for docs on the development container
- [./dev/ci.sh](./dev/ci.sh) (`yarn ci`)
  - Runs formatters, linters and tests
- [./dev/fmt.sh](./dev/fmt.sh) (`yarn fmt`)
  - Runs formatters
- [./dev/lint.sh](./dev/lint.sh) (`yarn lint`)
  - Runs linters
- [./dev/test.sh](./dev/test.sh) (`yarn test`)
  - Runs tests
- [./dev/vscode.sh](./dev/vscode.sh) (`yarn vscode`)
  - Ensures `lib/vscode` is cloned, patched and dependencies are installed
- [./dev/vscode.patch](./dev/vscode.patch)
  - Our patch of VS Code to enable remote browser access
  - Generate it with `yarn vscode:diff` and apply with `yarn vscode:patch`
- [./dev/watch.ts](./dev/watch.ts) (`yarn watch`)
  - Starts a process to build and launch code-server and restart on any code changes
  - Example usage in [CONTRIBUTING.md](../doc/CONTRIBUTING.md)

## build

This directory contains the scripts used to build code-server.

- [./build/build-code-server.sh](./build/build-code-server.sh) (`yarn build`)
  - Builds code-server into ./out and bundles the frontend into ./dist.
- [./build/build-vscode.sh](./build/build-vscode.sh) (`yarn build:vscode`)
  - Builds vscode into ./lib/vscode/out-vscode.
- [./build/build-release.sh](./build/build-release.sh) (`yarn release`)
  - Bundles the output of the above two scripts into a single node module at ./release.
  - Will build a static release with node/node_modules into `./release-static`
    if `STATIC=1` is set.
- [./build/clean.sh](./build/clean.sh) (`yarn clean`)
  - Removes all git ignored files like build artifacts.
  - Will also `git reset --hard lib/vscode`
  - Useful to do a clean build.
- [./build/code-server.sh](./build/code-server.sh)
  - Copied into static releases to run code-server with the bundled node binary.
- [./build/archive-static-release.sh](./build/archive-static-release.sh)
  - Archives `./release-static` into a tar/zip for CI with the proper directory name scheme
- [./build/test-release.sh](./build/test-static-release.sh)
  - Ensures code-server in the `./release-static` directory runs
- [./build/build-static-pkgs.sh](./build/build-static-pkgs.sh) (`yarn pkg`)
  - Uses [nfpm](https://github.com/goreleaser/nfpm) to generate .deb and .rpm from a static release
- [./build/nfpm.yaml](./build/nfpm.yaml)
  - Used to configure [nfpm](https://github.com/goreleaser/nfpm) to generate .deb and .rpm
- [./build/code-server-nfpm.sh](./build/code-server-nfpm.sh)
  - Entrypoint script for code-server for .deb and .rpm

## release-container

This directory contains the release docker container.

## container

This directory contains the container for CI.

## steps

This directory contains a few scripts used in CI. Just helps avoid clobbering .travis.yml.

- [./steps/test.sh](./steps/test.sh)
  - Runs `yarn ci` after ensuring VS Code is patched
- [./steps/static-release.sh](./steps/static-release.sh)
  - Runs the full static build process for CI
- [./steps/linux-release.sh](./steps/linux-release.sh)
  - Runs the full static build process for CI
  - Packages the release into a .deb and .rpm
  - Builds and pushes a docker release
- [./steps/publish-npm.sh](./steps/publish-npm.sh)
  - Authenticates yarn and publishes the built package from `./release`
