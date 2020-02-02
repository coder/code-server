# code-server &middot; [![MIT license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/cdr/code-server/blob/master/LICENSE) [!["Latest Release"](https://img.shields.io/github/release/cdr/code-server.svg)](https://github.com/cdr/code-server/releases/latest) [![Build Status](https://img.shields.io/travis/com/cdr/code-server/master)](https://github.com/cdr/code-server)

`code-server` is [VS Code](https://github.com/Microsoft/vscode) running on a
remote server, accessible through the browser.

Try it out:

```bash
docker run -it -p 127.0.0.1:8080:8080 -v "$PWD:/home/coder/project" codercom/code-server
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

- 64-bit host.
- At least 1GB of RAM.
- 2 cores or more are recommended (1 core works but not optimally).
- Secure connection over HTTPS or localhost (required for service workers).
- For Linux: GLIBC 2.17 or later and GLIBCXX 3.4.15 or later.
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

See
[VS Code's prerequisites](https://github.com/Microsoft/vscode/wiki/How-to-Contribute#prerequisites)
before building.

```shell
export OUT=/path/to/output/build                 # Optional if only building. Required if also developing.
yarn build $vscodeVersion $codeServerVersion     # See scripts/ci.bash for the VS Code version to use.
                                                 # The code-server version can be anything you want.
node /path/to/output/build/out/vs/server/main.js # You can run the built JavaScript with Node.
yarn binary $vscodeVersion $codeServerVersion    # Or you can package it into a binary.
```

## Security

### Authentication
By default `code-server` enables password authentication using a randomly
generated password. You can set the `PASSWORD` environment variable to use your
own instead or use `--auth none` to disable password authentication.

Do not expose `code-server` to the open internet without some form of
authentication.

### Encrypting traffic with HTTPS
If you aren't doing SSL termination elsewhere you can directly give
`code-server` a certificate with `code-server --cert` followed by the path to
your certificate. Additionally, you can use certificate keys with `--cert-key`
followed by the path to your key. If you pass `--cert` without any path
`code-server` will generate a self-signed certificate.

If `code-server` has been passed a certificate it will also respond to HTTPS
requests and will redirect all HTTP requests to HTTPS. Otherwise it will respond
only to HTTP requests.

You can use [Let's Encrypt](https://letsencrypt.org/) to get an SSL certificate
for free.

Do not expose `code-server` to the open internet without SSL, whether built-in
or through a proxy.

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

code-server does not provide access to the official
[Visual Studio Marketplace](https://marketplace.visualstudio.com/vscode). Instead,
Coder has created a custom extension marketplace that we manage for open-source
extensions. If you want to use an extension with code-server that we do not have
in our marketplace please look for a release in the extension’s repository,
contact us to see if we have one in the works or, if you build an extension
locally from open source, you can copy it to the `extensions` folder. If you
build one locally from open-source please contribute it to the project and let
us know so we can give you props! If you have your own custom marketplace, it is
possible to point code-server to it by setting the `SERVICE_URL` and `ITEM_URL`
environment variables.

## Telemetry

Use the `--disable-telemetry` flag to completely disable telemetry. We use the
data collected to improve code-server.

## Contributing

### Development

See
[VS Code's prerequisites](https://github.com/Microsoft/vscode/wiki/How-to-Contribute#prerequisites)
before developing.

```shell
git clone https://github.com/microsoft/vscode
cd vscode
git checkout ${vscodeVersion} # See scripts/ci.bash for the version to use.
yarn
git clone https://github.com/cdr/code-server src/vs/server
cd src/vs/server
yarn
yarn patch:apply
yarn watch
# Wait for the initial compilation to complete (it will say "Finished compilation").
# Run the next command in another shell.
yarn start
# Visit http://localhost:8080
```

If you run into issues about a different version of Node being used, try running
`npm rebuild` in the VS Code directory.

### Upgrading VS Code

We patch VS Code to provide and fix some functionality. As the web portion of VS
Code matures, we'll be able to shrink and maybe even entirely eliminate our
patch. In the meantime, however, upgrading the VS Code version requires ensuring
that the patch still applies and has the intended effects.

To generate a new patch, **stage all the changes** you want to be included in
the patch in the VS Code source, then run `yarn patch:generate` in this
directory.

Our changes include:

- Allow multiple extension directories (both user and built-in).
- Modify the loader, websocket, webview, service worker, and asset requests to
  use the URL of the page as a base (and TLS if necessary for the websocket).
- Send client-side telemetry through the server.
- Make changing the display language work.
- Make it possible for us to load code on the client.
- Make extensions work in the browser.
- Fix getting permanently disconnected when you sleep or hibernate for a while.
- Make it possible to automatically update the binary.

## License

[MIT](LICENSE)

## Enterprise

Visit [our enterprise page](https://coder.com) for more information about our
enterprise offering.

## Commercialization

If you would like to commercialize code-server, please contact
contact@coder.com.
