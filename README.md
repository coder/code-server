# code-server

code-server allows you to run [VS Code](https://github.com/Microsoft/vscode) on any machine that's located anywhere and access it using a web browser.

![Screenshot](./doc/assets/screenshot.png)

## Highlights

- **Code everywhere**
  - Code on your Chromebook, tablet, and laptop with a consistent development environment
  - Develop on a Linux machine and pick up from any device with a web browser
- **Server-powered**
  - Take advantage of cloud servers to speed up tests, compilations, downloads, and more
  - Preserve battery life when you're on the go, as all intensive tasks runs on your server
  - Make use of a spare computer you have lying around and turn it into a full development environment

## Quick Install

*To see full installation instructions, including the install script, instructions for manual installation, and the Docker image, see [Installation](./docs/install.md).*

We offer [install scripts](./install.sh) for Linux, macOS, and FreeBSD; the script uses the system package manager (if possible).

1. Print out the install process:

```bash
curl -fsSL https://code-server.dev/install.sh | sh -s -- --dry-run
```

2. Install:

```bash
curl -fsSL https://code-server.dev/install.sh | sh
```

The install script prints out instructions for running and starting code-server.

See our guide for [setup and configuration instructions](./docs/guide.md).

## Contributing

If you would like to contribute to code-server, please see our [guidelines](./docs/CONTRIBUTING.md).

## Hiring

We ([@cdr](https://github.com/cdr)) are looking for a engineers to help [maintain
code-server](https://jobs.lever.co/coder/e40becde-2cbd-4885-9029-e5c7b0a734b8), innovate on open source, and streamline dev workflows.

Our main office is in Austin, Texas. Remote is ok as long as
you're in North America or Europe.

Please get in [touch](mailto:jobs@coder.com) with your resume/GitHub if interested.

## For Organizations

Visit [our website](https://coder.com) for more information about remote development for your organization using Coder Enterprise.
