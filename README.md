# code-server &middot; [![MIT license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/cdr/code-server/blob/master/LICENSE) [!["Latest Release"](https://img.shields.io/github/release/cdr/code-server.svg)](https://github.com/cdr/code-server/releases/latest) [![Build Status](https://img.shields.io/travis/com/cdr/code-server/master)](https://github.com/cdr/code-server)

`code-server` is [VS Code](https://github.com/Microsoft/vscode) running on a
remote server, accessible through the browser.

Try it out:
```bash
docker run -it -p 127.0.0.1:8080:8080 -v "${HOME}/.local/share/code-server:/home/coder/.local/share/code-server" -v "$PWD:/home/coder/project" codercom/code-server:v2
```

- **Consistent environment:** Code on your Chromebook, tablet, and laptop with a
  consistent dev environment. develop more easily for Linux if you have a
  Windows or Mac, and pick up where you left off when switching workstations.
- **Server-powered:** Take advantage of large cloud servers to speed up tests,
  compilations, downloads, and more. Preserve battery life when you're on the go
  since all intensive computation runs on your server.

![Screenshot](/doc/assets/ide.gif)

## Getting Started

### Requirements

- Minimum GLIBC version of 2.17 and a minimum version of GLIBCXX of 3.4.15.
  - This is the main requirement for building Visual Studio Code. We cannot go lower than this.
- A 64-bit host with at least 1GB RAM and 2 cores.
   - 1 core hosts would work but not optimally.
- Docker (for Docker versions of `code-server`).

### Run over SSH
Use [sshcode](https://github.com/codercom/sshcode) for a simple setup.

### Docker
See the Docker one-liner mentioned above. Dockerfile is at [/Dockerfile](/Dockerfile).

To debug Golang using the
[ms-vscode-go extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode.Go),
you need to add `--security-opt seccomp=unconfined` to your `docker run`
arguments when launching code-server with Docker. See
[#725](https://github.com/cdr/code-server/issues/725) for details.

### Digital Ocean
[![Create a Droplet](./doc/assets/droplet.svg)](https://marketplace.digitalocean.com/apps/code-server?action=deploy)

### Binaries
1. [Download a binary](https://github.com/cdr/code-server/releases). (Linux and
    OS X supported. Windows coming soon)
2. Unpack the downloaded file then run the binary.
3. In your browser navigate to `localhost:8080`.

- For self-hosting and other information see [doc/quickstart.md](doc/quickstart.md).
- For hosting on cloud platforms see [doc/deploy.md](doc/deploy.md).

### Build
- If you also plan on developing, set the `OUT` environment variable. Otherwise
  it will build in this directory which will cause issues because `yarn watch`
  will try to compile the build directory as well.
- Run `yarn build ${vscodeVersion} ${codeServerVersion}` in this directory (for
  example: `yarn build 1.36.0 development`).
- If you target the same VS Code version our Travis builds do everything will
  work but if you target some other version it might not (we have to do some
  patching to VS Code so different versions aren't always compatible).
- You can run the built code with `node path/to/build/out/vs/server/main.js` or run
  `yarn binary` with the same arguments in the previous step to package the
  code into a single binary.

## Known Issues
- Creating custom VS Code extensions and debugging them doesn't work.
- Extension profiling and tips are currently disabled.

## Future
- **Stay up to date!** Get notified about new releases of code-server.
  ![Screenshot](/doc/assets/release.gif)
- Windows support.
- Electron and Chrome OS applications to bridge the gap between local<->remote.
- Run VS Code unit tests against our builds to ensure features work as expected.

## Extensions
At the moment we can't use the official VS Code Marketplace. We've created a
custom extension marketplace focused around open-sourced extensions. However,
you can manually download the extension to your extensions directory. It's also
possible to set your own marketplace URLs by setting the `SERVICE_URL` and
`ITEM_URL` environment variables.

## Telemetry
Use the `--disable-telemetry` flag to completely disable telemetry. We use the
data collected to improve code-server.

## Contributing
### Development
```shell
git clone https://github.com/microsoft/vscode
cd vscode
git checkout <see travis.yml for the VS Code version to use here>
git clone https://github.com/cdr/code-server src/vs/server
cd src/vs/server
yarn patch:apply
yarn
yarn watch
# Wait for the initial compilation to complete (it will say "Finished compilation").
# Run the next command in another shell.
yarn start
# Visit http://localhost:8080
```

If you run into issues about a different version of Node being used, try running
`npm rebuild` in the VS Code directory and ignore the error at the end from
`vscode-ripgrep`.

### Upgrading VS Code
We patch VS Code to provide and fix some functionality. As the web portion of VS
Code matures, we'll be able to shrink and maybe even entirely eliminate our
patch. In the meantime, however, upgrading the VS Code version requires ensuring
that the patch still applies and has the intended effects.

To generate a new patch, **stage all the changes** you want to be included in
the patch in the VS Code source, then run `yarn patch:generate` in this
directory.

Our changes include:
- Change the remote schema to `code-server`.
- Allow multiple extension directories (both user and built-in).
- Modify the loader, websocket, webview, service worker, and asset requests to
  use the URL of the page as a base (and TLS if necessary for the websocket).
- Send client-side telemetry through the server and get the initial log level
  from the server.
- Add an upload service for use in editor windows and the explorer along with a
  file prefix to ignore for temporary files created during upload.
- Make changing the display language work.
- Make hiding or toggling the menu bar possible.
- Make it possible for us to load code on the client.
- Modify the build process to include our code.

## License
[MIT](LICENSE)

## Enterprise
Visit [our enterprise page](https://coder.com/enterprise) for more information
about our enterprise offering.

## Commercialization
If you would like to commercialize code-server, please contact
contact@coder.com.
