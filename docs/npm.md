<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# npm Install Requirements

- [Node.js version](#nodejs-version)
- [Ubuntu, Debian](#ubuntu-debian)
- [Fedora, CentOS, RHEL](#fedora-centos-rhel)
- [Alpine](#alpine)
- [macOS](#macos)
- [FreeBSD](#freebsd)
- [Issues with Node.js after version upgrades](#issues-with-nodejs-after-version-upgrades)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

If you're installing code-server via `npm`, you'll need to install additional
dependencies required to build the native modules used by VS Code. This article
includes installing instructions based on your operating system.

## Node.js version

We use the same major version of Node.js shipped with VSCode's Electron,
which is currently `14.x`. VS Code also [lists Node.js
requirements](https://github.com/microsoft/vscode/wiki/How-to-Contribute#prerequisites).

Using other versions of Node.js [may lead to unexpected
behavior](https://github.com/cdr/code-server/issues/1633).

## Ubuntu, Debian

```bash
sudo apt-get install -y \
  build-essential \
  pkg-config \
  python3
npm config set python python3
```

## Fedora, CentOS, RHEL

```bash
sudo yum groupinstall -y 'Development Tools'
sudo yum config-manager --set-enabled PowerTools # unnecessary on CentOS 7
sudo yum install -y python2
npm config set python python2
```

## Alpine

```bash
apk add alpine-sdk bash libstdc++ libc6-compat
npm config set python python3
```

## macOS

```bash
xcode-select --install
```

## FreeBSD

```sh
pkg install -y git python npm-node14 yarn-node14 pkgconf
pkg install -y libinotify
```

## Issues with Node.js after version upgrades

Occasionally, you may run into issues with Node.js.

If you install code-server using `yarn` or `npm`, and you upgrade your Node.js
version, you may need to reinstall code-server to recompile native modules.
Sometimes, you can get around this by navigating into code-server's `lib/vscode`
directory and running `npm rebuild` to recompile the modules.

A step-by-step example of how you might do this is:

1. Install code-server: `brew install code-server`
2. Navigate into the directory: `cd /usr/local/Cellar/code-server/<version>/libexec/lib/vscode/`
3. Recompile the native modules: `npm rebuild`
4. Restart code-server

If you need further assistance, post on our [GitHub Discussions
page](https://github.com/cdr/code-server/discussions).
