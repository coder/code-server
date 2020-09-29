# code-server &middot; [!["GitHub Discussions"](https://img.shields.io/badge/%20GitHub-%20Discussions-gray.svg?longCache=true&logo=github&colorB=purple)](https://github.com/cdr/code-server/discussions) [!["Join us on Slack"](https://img.shields.io/badge/join-us%20on%20slack-gray.svg?longCache=true&logo=slack&colorB=brightgreen)](https://cdr.co/join-community) [![Twitter Follow](https://img.shields.io/twitter/follow/CoderHQ?label=%40CoderHQ&style=social)](https://twitter.com/coderhq)

code-server allows you to run [VS Code](https://github.com/Microsoft/vscode)
on any machine anywhere and access it using a web browser.

![Screenshot](./docs/assets/screenshot.png)

## Highlights

- Code on any device with a consistent development environment
- Use cloud servers to speed up tests, compilations, downloads, and more
- Preserve battery life when you're on the go; all intensive tasks run on your server

## Getting Started

We offer an [install script](./install.sh) for Linux, macOS, and FreeBSD that automates most of the process; the script uses the system package manager (if possible). Alternatively, see [Installation](./docs/install.md#quick-install) for manual installation instructions for most use cases.

If you use the install script, you can see what occurs during the install process by running the following (there are no file changes at this point):

```bash
curl -fsSL https://code-server.dev/install.sh | sh -s -- --dry-run
```

To install, run:

```bash
curl -fsSL https://code-server.dev/install.sh | sh
```

When done, the install script prints out instructions for running and starting code-server.

We also have an in-depth [setup and configuration](./docs/guide.md) guide.

### Alpha Program 🐣

We're working on a cloud platform to make deploying and managing code-server easier. If you don't want to worry about

- TLS
- Authentication
- Port Forwarding

consider [joining our alpha program](https://codercom.typeform.com/to/U4IKyv0W).

## FAQ

See answers to our [FAQ](./docs/FAQ.md).

## Want to help?

If you would like to contribute to code-server, please see our [guidelines](./docs/CONTRIBUTING.md).

### Working at Coder

We ([@cdr](https://github.com/cdr)) are looking for engineers to help [maintain
code-server](https://jobs.lever.co/coder/e40becde-2cbd-4885-9029-e5c7b0a734b8), innovate on open source, and streamline dev workflows.

Our main office is in Austin, Texas. Remote is ok as long as
you're in North America or Europe.

Please get in [touch](mailto:jobs@coder.com) with your resume/GitHub if interested.

## For Organizations

Visit [our website](https://coder.com) for more information about remote development for your organization using Coder Enterprise.
