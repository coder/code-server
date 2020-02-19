# Contributing

## Development Workflow

- [VS Code prerequisites](https://github.com/Microsoft/vscode/wiki/How-to-Contribute#prerequisites)

```shell
yarn
yarn vscode
yarn watch # Visit http://localhost:8080 once completed.
```

Any changes made to the source will be live reloaded.

If you run into issues about a different version of Node being used, try running
`npm rebuild` in the VS Code directory.

If changes are made to the patch and you've built previously you must manually
reset VS Code then run `yarn vscode:patch`.

Some docs are available at [../src/node/app](../src/node/app) on how code-server
works internally.

## Build

- [VS Code prerequisites](https://github.com/Microsoft/vscode/wiki/How-to-Contribute#prerequisites)

```shell
yarn
yarn build
node build/out/entry.js # You can run the built JavaScript with Node.
yarn binary             # Or you can package it into a binary.
```
