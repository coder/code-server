# Build instructions for code-server 🏗️

code-server has several yarn tasks for building the entire binary or specific portions of the app. This guide provides steps to do the aforementioned tasks. Coder recommends having Node 10.15.1+ installed.
> Yarn installation: https://yarnpkg.com/lang/en/docs/install

### Build the binary

1. Clone the [repository](https://github.com/codercom/code-server.git)
2. `cd` into `code-server`
3. Run `yarn`
4. Run `yarn task build:server:binary`
   > Binary will be placed in `packages/server` named after the platform and architecture (`cli-darwin-x64`)

### Run without building
1. Clone the [repository](https://github.com/codercom/code-server.git)
2. `cd` into `code-server`
3. Run `yarn`
4. Run `yarn start`
    > *If you run into issues with websocket disconnects, run with `yarn start --no-auth`*

### Build Tasks

- **bootstrap-fork**: Forks VS Code sub-processes such as the shared process, extension host, searcher, and watcher
  ```bash
  yarn task build:bootstrap:fork
  ```
- **binary package**: Packages existing built files with [nbin](https://github.com/codercom/nbin)
  ```bash
  yarn task build:server:binary:package
  ```
- **binary copy**: Copies all existing built files into a single directory
  ```bash
  yarn task build:server:binary:copy
  ```
- **app browser**: Builds the login page for authenticated servers
  ```bash
  yarn task build:app:browser
  ```
- **web**: Builds the VS Code editor
  ```bash
  yarn task build:web
  ```
- **vscode install**: Downloads and extracts the correct VS Code version. If the version exists, runs `git reset --hard`
  ```bash
  yarn task vscode:install
  ```
- **vscode patch**: Patches VS Code for the browser
  ```bash
  yarn task vscode:patch
  ```
    > *VS Code must be downloaded and extracted first with the `vscode:install`*
- **package**: Packages code-server for release in `.gz` and `.zip` format
  ```bash
  yarn task package
  ```
- **bundle**: Runs all yarn task with the exception of `package`
  ```bash
  yarn task build:server:bundle
  ```