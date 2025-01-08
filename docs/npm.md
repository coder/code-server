<!-- prettier-ignore-start -->
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# npm Install Requirements

- [Node.js version](#nodejs-version)
- [Ubuntu, Debian](#ubuntu-debian)
- [Fedora, CentOS, RHEL](#fedora-centos-rhel)
- [Alpine](#alpine)
- [macOS](#macos)
- [FreeBSD](#freebsd)
- [Windows](#windows)
- [Installing](#installing)
- [Troubleshooting](#troubleshooting)
  - [Issues with Node.js after version upgrades](#issues-with-nodejs-after-version-upgrades)
  - [Debugging install issues with npm](#debugging-install-issues-with-npm)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->
<!-- prettier-ignore-end -->

If you're installing code-server via `npm`, you'll need to install additional
dependencies required to build the native modules used by VS Code. This article
includes installing instructions based on your operating system.

> **WARNING**: Do not use `yarn` to install code-server. Unlike `npm`, it does not respect
> lockfiles for distributed applications. It will instead use the latest version
> available at installation time - which might not be the one used for a given
> code-server release, and [might lead to unexpected behavior](https://github.com/coder/code-server/issues/4927).

## Node.js version

We use the same major version of Node.js shipped with Code's remote, which is
currently `20.x`. VS Code also [lists Node.js
requirements](https://github.com/microsoft/vscode/wiki/How-to-Contribute#prerequisites).

Using other versions of Node.js [may lead to unexpected
behavior](https://github.com/coder/code-server/issues/1633).

## Ubuntu, Debian

```bash
sudo apt-get install -y \
  build-essential \
  pkg-config \
  python3
npm config set python python3
```

Proceed to [installing](#installing)

## Fedora, CentOS, RHEL

```bash
sudo yum groupinstall -y 'Development Tools'
sudo yum config-manager --set-enabled PowerTools # unnecessary on CentOS 7
sudo yum install -y python2
npm config set python python2
```

Proceed to [installing](#installing)

## Alpine

```bash
apk add alpine-sdk bash libstdc++ libc6-compat python3 krb5-dev
```

Proceed to [installing](#installing)

## macOS

```bash
xcode-select --install
```

Proceed to [installing](#installing)

## FreeBSD

```sh
pkg install -y git python npm-node20 pkgconf
pkg install -y libinotify
```

Proceed to [installing](#installing)

## Windows

Installing code-server requires all of the [prerequisites for VS Code development](https://github.com/Microsoft/vscode/wiki/How-to-Contribute#prerequisites). When installing the C++ compiler tool chain, we recommend using "Option 2: Visual Studio 2019" for best results.

Next, install code-server with:

```bash
npm install --global code-server
code-server
# Now visit http://127.0.0.1:8080. Your password is in ~/.config/code-server/config.yaml
```

A `postinstall.sh` script will attempt to run. Select your terminal (e.g., Git bash) as the default shell for npm run-scripts. If an additional dialog does not appear, run the install command again.

If the `code-server` command is not found, you'll need to [add a directory to your PATH](https://www.architectryan.com/2018/03/17/add-to-the-path-on-windows-10/). To find the directory, use the following command:

```shell
npm config get prefix
```

For help and additional troubleshooting, see [#1397](https://github.com/coder/code-server/issues/1397).

## Installing

After adding the dependencies for your OS, install the code-server package globally:

```bash
npm install --global code-server
code-server
# Now visit http://127.0.0.1:8080. Your password is in ~/.config/code-server/config.yaml
```

## Troubleshooting

If you need further assistance, post on our [GitHub Discussions
page](https://github.com/coder/code-server/discussions).

### Issues with Node.js after version upgrades

Occasionally, you may run into issues with Node.js.

If you install code-server using `npm`, and you upgrade your Node.js
version, you may need to reinstall code-server to recompile native modules.
Sometimes, you can get around this by navigating into code-server's `lib/vscode`
directory and running `npm rebuild` to recompile the modules.

A step-by-step example of how you might do this is:

1. Install code-server: `brew install code-server`
2. Navigate into the directory: `cd /usr/local/Cellar/code-server/<version>/libexec/lib/vscode/`
3. Recompile the native modules: `npm rebuild`
4. Restart code-server

### Debugging install issues with npm

To debug installation issues, install with `npm`:

```shell
# Uninstall
npm uninstall --global code-server > /dev/null 2>&1

# Install with logging
npm install --loglevel verbose --global code-server
```
