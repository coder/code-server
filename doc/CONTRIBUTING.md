# Contributing

- [Detailed CI and build process docs](../ci)
- [Our VS Code Web docs](../src/node/app)

## Requirements

Please refer to [VS Code's prerequisites](https://github.com/Microsoft/vscode/wiki/How-to-Contribute#prerequisites).

Differences:

- We require at least node v12 but later versions should work
- We use [fnpm](https://github.com/goreleaser/nfpm) to build .deb and .rpm packages

## Development Workflow

```shell
yarn
yarn vscode
yarn watch # Visit http://localhost:8080 once completed.
```

To develop inside of an isolated docker container:

```shell
./ci/dev/container/exec.sh

root@12345:/code-server# yarn
root@12345:/code-server# yarn vscode
root@12345:/code-server# yarn watch
```

Any changes made to the source will be live reloaded.

If changes are made to the patch and you've built previously you must manually
reset VS Code then run `yarn vscode:patch`.

Some docs are available at [../src/node/app](../src/node/app) on how code-server
works internally.

## Build

```shell
yarn
yarn vscode
yarn build
yarn build:vscode
yarn release
cd release
yarn --production
node . # Run the built JavaScript with Node.
```

Now you can make it static and build packages with:

```
yarn release:static
yarn test:static-release
yarn package
```

The static release will be in `./release-static` and .deb, .rpm and self-contained release in `./release-packages`.
