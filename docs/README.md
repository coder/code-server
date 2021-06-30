# code-server

[!["GitHub Discussions"](https://img.shields.io/badge/%20GitHub-%20Discussions-gray.svg?longCache=true&logo=github&colorB=purple)](https://github.com/cdr/code-server/discussions) [!["Join us on Slack"](https://img.shields.io/badge/join-us%20on%20slack-gray.svg?longCache=true&logo=slack&colorB=brightgreen)](https://cdr.co/join-community) [![Twitter Follow](https://img.shields.io/twitter/follow/CoderHQ?label=%40CoderHQ&style=social)](https://twitter.com/coderhq) [![codecov](https://codecov.io/gh/cdr/code-server/branch/main/graph/badge.svg?token=5iM9farjnC)](https://codecov.io/gh/cdr/code-server) [![See v3.10.2 docs](https://img.shields.io/static/v1?label=Docs&message=see%20v3.10.2%20&color=blue)](https://github.com/cdr/code-server/tree/v3.10.2/docs)

Run [VS Code](https://github.com/Microsoft/vscode) on any machine anywhere and access it in the browser.

![Screenshot](./assets/screenshot.png)

## Highlights

- Code on any device with a consistent development environment
- Use cloud servers to speed up tests, compilations, downloads, and more
- Preserve battery life when you're on the go; all intensive tasks run on your server

## Requirements

For a good experience, we recommend at least:

- 1 GB of RAM
- 2 cores

You can use whatever linux distribution floats your boat but in our [guide](https://coder.com/docs/code-server/v3.10.2/guide) we assume Debian on Google Cloud.

## Getting Started

There are three ways you can get started:

1. Using the [install script](https://github.com/cdr/code-server/blob/main/install.sh), which automates most of the process. The script uses the system package manager (if possible)
2. Manually installing code-server; see [Installation](https://coder.com/docs/code-server/v3.10.2/install) for instructions applicable to most use cases
3. Use our one-click buttons and guides to [deploy code-server to a popular cloud provider](https://github.com/cdr/deploy-code-server) ⚡

If you choose to use the install script, you can preview what occurs during the install process:

```bash
curl -fsSL https://code-server.dev/install.sh | sh -s -- --dry-run
```

To install, run:

```bash
curl -fsSL https://code-server.dev/install.sh | sh
```

When done, the install script prints out instructions for running and starting code-server.

We also have an in-depth [setup and configuration](https://coder.com/docs/code-server/v3.10.2/guide) guide.

### code-server --link

We're working on a cloud platform that makes deploying and managing code-server easier.
Consider running code-server with the beta flag `--link` if you don't want to worry about

- TLS
- Authentication
- Port Forwarding

```bash
$ code-server --link
Proxying code-server, you can access your IDE at https://valmar-jon.cdr.co
```

## FAQ

See [./FAQ.md](https://coder.com/docs/code-server/v3.10.2/FAQ).

## Want to help?

See [CONTRIBUTING](https://coder.com/docs/code-server/v3.10.2/CONTRIBUTING) for details.

## Hiring

Interested in [working at Coder](https://coder.com/careers)? Check out [our open positions](https://coder.com/careers#openings)!

## For Organizations

Want remote development for your organization or enterprise? Visit
[our website](https://coder.com) to learn more about Coder.
