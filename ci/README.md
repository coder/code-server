# ci

This directory contains scripts used for code-server's continuous integration infrastructure.

Some of these scripts contain more detailed documentation and options
in header comments.

Any file or directory in this subdirectory should be documented here.

- [./ci/lib.sh](./lib.sh)
  - Contains code duplicated across these scripts.

## dev

This directory contains scripts used for the development of code-server.

- [./ci/dev/image](./dev/image)
  - See [./docs/CONTRIBUTING.md](../docs/CONTRIBUTING.md) for docs on the development container.
- [./ci/dev/fmt.sh](./dev/fmt.sh) (`yarn fmt`)
  - Runs formatters.
- [./ci/dev/lint.sh](./dev/lint.sh) (`yarn lint`)
  - Runs linters.
- [./ci/dev/test-unit.sh](./dev/test-unit.sh) (`yarn test:unit`)
  - Runs unit tests.
- [./ci/dev/test-e2e.sh](./dev/test-e2e.sh) (`yarn test:e2e`)
  - Runs end-to-end tests.
- [./ci/dev/watch.ts](./dev/watch.ts) (`yarn watch`)
  - Starts a process to build and launch code-server and restart on any code changes.
  - Example usage in [./docs/CONTRIBUTING.md](../docs/CONTRIBUTING.md).
- [./ci/dev/gen_icons.sh](./dev/gen_icons.sh) (`yarn icons`)
  - Generates the various icons from a single `.svg` favicon in
    `src/browser/media/favicon.svg`.
  - Requires [imagemagick](https://imagemagick.org/index.php)

## build

This directory contains the scripts used to build and release code-server.
You can disable minification by setting `MINIFY=`.

- [./ci/build/build-code-server.sh](./build/build-code-server.sh) (`yarn build`)
  - Builds code-server into `./out` and bundles the frontend into `./dist`.
- [./ci/build/build-vscode.sh](./build/build-vscode.sh) (`yarn build:vscode`)
  - Builds vscode into `./lib/vscode/out-vscode`.
- [./ci/build/build-release.sh](./build/build-release.sh) (`yarn release`)
  - Bundles the output of the above two scripts into a single node module at `./release`.
- [./ci/build/clean.sh](./build/clean.sh) (`yarn clean`)
  - Removes all build artifacts.
  - Useful to do a clean build.
- [./ci/build/code-server.sh](./build/code-server.sh)
  - Copied into standalone releases to run code-server with the bundled node binary.
- [./ci/build/test-standalone-release.sh](./build/test-standalone-release.sh) (`yarn test:standalone-release`)
  - Ensures code-server in the `./release-standalone` directory works by installing an extension.
- [./ci/build/build-packages.sh](./build/build-packages.sh) (`yarn package`)
  - Packages `./release-standalone` into a `.tar.gz` archive in `./release-packages`.
  - If on linux, [nfpm](https://github.com/goreleaser/nfpm) is used to generate `.deb` and `.rpm`.
- [./ci/build/nfpm.yaml](./build/nfpm.yaml)
  - Used to configure [nfpm](https://github.com/goreleaser/nfpm) to generate `.deb` and `.rpm`.
- [./ci/build/code-server-nfpm.sh](./build/code-server-nfpm.sh)
  - Entrypoint script for code-server for `.deb` and `.rpm`.
- [./ci/build/code-server.service](./build/code-server.service)
  - systemd user service packaged into the `.deb` and `.rpm`.
- [./ci/build/release-github-draft.sh](./build/release-github-draft.sh) (`yarn release:github-draft`)
  - Uses [gh](https://github.com/cli/cli) to create a draft release with a template description.
- [./ci/build/release-github-assets.sh](./build/release-github-assets.sh) (`yarn release:github-assets`)
  - Downloads the release-package artifacts for the current commit from CI.
  - Uses [gh](https://github.com/cli/cli) to upload the artifacts to the release
    specified in `package.json`.
- [./ci/build/npm-postinstall.sh](./build/npm-postinstall.sh)
  - Post install script for the npm package.
  - Bundled by`yarn release`.

## release-image

This directory contains the release docker container image.

- [./ci/steps/build-docker-buildx-push.sh](./steps/docker-buildx-push.sh)
  - Builds the release containers with tags `codercom/code-server-$ARCH:$VERSION` for amd64 and arm64 with `docker buildx` and pushes them.
  - Assumes debian releases are ready in `./release-packages`.

## images

This directory contains the images for CI.

## steps

This directory contains the scripts used in CI.
Helps avoid clobbering the CI configuration.

- [./steps/fmt.sh](./steps/fmt.sh)
  - Runs `yarn fmt`.
- [./steps/lint.sh](./steps/lint.sh)
  - Runs `yarn lint`.
- [./steps/test-unit.sh](./steps/test-unit.sh)
  - Runs `yarn test:unit`.
- [./steps/test-integration.sh](./steps/test-integration.sh)
  - Runs `yarn test:integration`.
- [./steps/test-e2e.sh](./steps/test-e2e.sh)
  - Runs `yarn test:e2e`.
- [./steps/release.sh](./steps/release.sh)
  - Runs the release process.
  - Generates the npm package at `./release`.
- [./steps/release-packages.sh](./steps/release-packages.sh)
  - Takes the output of the previous script and generates a standalone release and
    release packages into `./release-packages`.
- [./steps/publish-npm.sh](./steps/publish-npm.sh)
  - Grabs the `npm-package` release artifact for the current commit and publishes it on npm.
- [./steps/docker-buildx-push.sh](./steps/docker-buildx-push.sh)
  - Builds the docker image and then pushes it.
- [./steps/push-docker-manifest.sh](./steps/push-docker-manifest.sh)
  - Loads all images in `./release-images` and then builds and pushes a multi architecture
    docker manifest for the amd64 and arm64 images to `codercom/code-server:$VERSION` and
    `codercom/code-server:latest`.
