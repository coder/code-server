# Building instructions for code-server 🏗️

code-server has several yarn tasks for building the entire binary or specific portions of the app. This guide provides steps to do the aforementioned tasks.

**NOTE:** Windows compatibility is in the works 

### Requirements
- Node 10.15.1+: https://nodejs.org/en/download/releases/

## Build the binary
1. Clone the [repository](https://github.com/codercom/code-server.git)
2. `cd` into `code-server`
3. Run `yarn`
4. Run `yarn task build:server:binary`
   > Binary will be placed in `packages/server` named after the platform and architecture (`cli-darwin-x64`)

### Run without building
Running from the binary is possible with `yarn-start` after you have built the binary at least once. This is required for bootstrap-fork and built in extensions to work properly.

### Build Tasks

- **bootstrap-fork**: Forks VS Code sub-processes such as the shared process, extension host, searcher, and watcher
  ```bash
  yarn task build:bootstrap-fork
  ```
- **binary package**: Packages existing built files with [nbin](https://github.com/codercom/nbin)
  ```bash
  yarn task build:server:binary:package
  ```
- **app browser**: Builds the login page for authenticated servers
  ```bash
  yarn task build:app:browser
  ```
- **web**: Builds the VS Code editor
  ```bash
  yarn task build:web
  ```
- **package**: Packages code-server for release in `.gz` and `.zip` format
  ```bash
  yarn task package
  ```
- **bundle**: Runs all yarn task with the exception of `package`
  ```bash
  yarn task build:server:bundle
  ```