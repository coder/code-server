# code-server

Run [VS Code](https://github.com/Microsoft/vscode) on any machine anywhere and access it in the browser.

![Screenshot](./doc/assets/screenshot.png)

## Highlights

- **Code everywhere**
  - Code on your Chromebook, tablet, and laptop with a consistent development environment.
  - Develop on a Linux machine and pick up from any device with a web browser.
- **Server-powered**
  - Take advantage of large cloud servers to speed up tests, compilations, downloads, and more.
  - Preserve battery life when you're on the go as all intensive tasks runs on your server.
  - Make use of a spare computer you have lying around and turn it into a full development environment.

## Getting Started

For a full setup and walkthrough, please see [./doc/guide.md](./doc/guide.md).

We have a [script](./install.sh) to install code-server for Linux and macOS.

It tries to use the system package manager if possible.

First run to print out the install process:

```bash
curl -fsSL https://code-server.dev/install.sh | sh -s -- --dry-run
```

Now to actually install:

```bash
curl -fsSL https://code-server.dev/install.sh | sh
```

The install script will print out how to run and start using code-server.

If you believe an install script used with `curl | sh` is insecure, please give
[this wonderful blogpost](https://sandstorm.io/news/2015-09-24-is-curl-bash-insecure-pgp-verified-install) by
[sandstorm.io](https://sandstorm.io) a read.

Docs on the install script, manual installation and docker image are at [./doc/install.md](./doc/install.md).

We also highly recommend reading the [FAQ](./doc/FAQ.md) on the [Differences compared to VS Code](./doc/FAQ.md#differences-compared-to-vs-code).

## FAQ

See [./doc/FAQ.md](./doc/FAQ.md).

## Contributing

See [./doc/CONTRIBUTING.md](./doc/CONTRIBUTING.md).

## Enterprise

Visit [our website](https://coder.com) for more information about our
enterprise offerings.
