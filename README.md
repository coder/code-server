# code-server &middot; [![MIT license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/cdr/code-server/blob/master/LICENSE) [!["Latest Release"](https://img.shields.io/github/release/cdr/code-server.svg)](https://github.com/cdr/code-server/releases/latest) [![Build Status](https://img.shields.io/travis/com/cdr/code-server/master)](https://github.com/cdr/code-server)

`code-server` is [VS Code](https://github.com/Microsoft/vscode) running on a
remote server, accessible through the browser.

Try it out:
```bash
docker run -it -p 127.0.0.1:8443:8443 -v "$PWD:/home/coder/project" codercom/code-server
```

- **Consistent environment:** Code on your Chromebook, tablet, and laptop with a
  consistent dev environment. develop more easily for Linux if you have a
  Windows or Mac, and pick up where you left off when switching workstations.
- **Server-powered:** Take advantage of large cloud servers to speed up tests,
  compilations, downloads, and more. Preserve battery life when you're on the go
  since all intensive computation runs on your server.

![Screenshot](/doc/assets/ide.gif)

## Getting Started
### Run over SSH
Use [sshcode](https://github.com/codercom/sshcode) for a simple setup.

### Docker
See the Docker one-liner mentioned above. Dockerfile is at [/Dockerfile](/Dockerfile).

To debug Golang using the
[ms-vscode-go extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode.Go),
you need to add `--security-opt seccomp=unconfined` to your `docker run`
arguments when launching code-server with Docker. See
[#725](https://github.com/cdr/code-server/issues/725) for details.

### Binaries
1. [Download a binary](https://github.com/cdr/code-server/releases). (Linux and
    OS X supported. Windows coming soon)
2. Unpack the downloaded file then run the binary.
3. In your browser navigate to `localhost:8443`.

- For self-hosting and other information see [doc/quickstart.md](doc/quickstart.md).
- For hosting on cloud platforms see [doc/deploy.md](doc/deploy.md).

### Build
- If you also plan on developing, set the `OUT` environment variable. Otherwise
  it will build in this directory which will cause issues because `yarn watch`
  will try to compile the build directory as well.
- For now `@coder/nbin` is a global dependency.
- Run `yarn build ${codeServerVersion} ${vscodeVersion} ${target} ${arch}` in
  this directory (for example: `yarn build development 1.36.0 linux x64`).
- If you target the same VS Code version our Travis builds do everything will
  work but if you target some other version it might not (we have to do some
  patching to VS Code so different versions aren't always compatible).
- You can run the built code with `node path/to/build/out/vs/server/main.js` or run
  `yarn binary` with the same arguments in the previous step to package the
  code into a single binary.

## Known Issues
- Uploading .vsix files doesn't work.
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
git checkout 1.36.1
git clone https://github.com/cdr/code-server src/vs/server
cd src/vs/server
yarn patch:apply
yarn
yarn watch
# Wait for the initial compilation to complete (it will say "Finished compilation").
# Run the next command in another shell.
yarn start
# Visit http://localhost:8443
```

### Upgrading VS Code
We have to patch VS Code to provide and fix some functionality. As the web
portion of VS Code matures, we'll be able to shrink and maybe even entirely
eliminate our patch. In the meantime, however, upgrading the VS Code version
requires ensuring that the patch still applies and has the intended effects.

To generate a new patch, **stage all the changes** you want to be included in
the patch in the VS Code source, then run `yarn patch:generate` in this
directory.

Our changes include:
- Add a `code-server` schema.
- Make the extension sidebar work in the browser. Mostly involves removing
  Node-specific code for the `extensions` channel client and adding a
  `gallery` channel.
- Allow multiple extension directories (both user and built-in).
- Rewrite assets used in the CSS (like icons) or as images to use the base URL.
- Change the loader to use the base URL.
- Change the web socket to use the base URL and TLS if necessary.
- Set the favicon using a relative path.
- Modify the file service to support writing from an asynchronous stream (for
  uploading files).
- Add a file prefix to ignore for temporary files created during upload.
- Insert our upload service for use in editor windows and explorer.
- Modify the log level to get its initial setting from the server.
- Get telemetry working by adding a channel for it.
- Change a regular expression used for mnemonics so it works on Firefox.
- Make it possible for us to load code on the client.

## License
[MIT](LICENSE)

## Enterprise
Visit [our enterprise page](https://coder.com/enterprise) for more information
about our enterprise offering.

## Commercialization
If you would like to commercialize code-server, please contact
contact@coder.com.
