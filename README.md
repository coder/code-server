# code-server &middot; [![MIT license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/cdr/code-server/blob/master/LICENSE) [!["Latest Release"](https://img.shields.io/github/release/cdr/code-server.svg)](https://github.com/cdr/code-server/releases/latest) [![Build Status](https://img.shields.io/travis/com/cdr/code-server/master)](https://github.com/cdr/code-server)

`code-server` is [VS Code](https://github.com/Microsoft/vscode) running on a
remote server, accessible through the browser.

Try it out:

```bash
docker run -it -p 127.0.0.1:8080:8080 -v "$PWD:/home/coder/project" codercom/code-server
```

- **Consistent environment:** Code on your Chromebook, tablet, and laptop with a
  consistent dev environment. Develop more easily for Linux if you have a
  Windows or Mac and pick up where you left off when switching workstations.
- **Server-powered:** Take advantage of large cloud servers to speed up tests,
  compilations, downloads, and more. Preserve battery life when you're on the go
  since all intensive computation runs on your server.

![Screenshot](/doc/assets/ide.gif)

## VS Code

- See [our VS Code readme](./src/vscode) for more information about how
  code-server and VS Code work together.

## Getting Started

### Requirements

- 64-bit host.
- At least 1GB of RAM.
- 2 cores or more are recommended (1 core works but not optimally).
- Secure connection over HTTPS or localhost (required for service workers and
  clipboard support).
- For Linux: GLIBC 2.17 or later and GLIBCXX 3.4.15 or later.
- Docker (for Docker versions of `code-server`).

### Run over SSH

Use [sshcode](https://github.com/codercom/sshcode) for a simple setup.

### Docker

See the Docker one-liner mentioned above. Dockerfile is at [/Dockerfile](/Dockerfile).

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

- [VS Code prerequisites](https://github.com/Microsoft/vscode/wiki/How-to-Contribute#prerequisites)

```shell
yarn
yarn build
node build/out/entry.js # You can run the built JavaScript with Node.
yarn binary             # Or you can package it into a binary.
```

If changes are made to the patch and you've built previously you must manually
reset VS Code then run `yarn patch:apply`.

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

## Future

- **Stay up to date!** Get notified about new releases of `code-server`.
  ![Screenshot](/doc/assets/release.gif)
- Electron and Chrome OS applications to bridge the gap between local<->remote.

## Telemetry

Use the `--disable-telemetry` flag to completely disable telemetry. We use the
data collected to improve code-server.

## Contributing

### Development

- [VS Code prerequisites](https://github.com/Microsoft/vscode/wiki/How-to-Contribute#prerequisites)

```shell
yarn
yarn watch # Visit http://localhost:8080 once completed.
```

If you run into issues about a different version of Node being used, try running
`npm rebuild` in the VS Code directory.

If changes are made to the patch and you've built previously you must manually
reset VS Code then run `yarn patch:apply`.

## License

[MIT](LICENSE)

## Enterprise

Visit [our enterprise page](https://coder.com) for more information about our
enterprise offering.

## Commercialization

If you would like to commercialize code-server, please contact
contact@coder.com.
