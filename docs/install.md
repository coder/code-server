<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# Install

- [Upgrading](#upgrading)
- [install.sh](#installsh)
  - [Flags](#flags)
  - [Detection Reference](#detection-reference)
- [Debian, Ubuntu](#debian-ubuntu)
- [Fedora, CentOS, RHEL, SUSE](#fedora-centos-rhel-suse)
- [Arch Linux](#arch-linux)
- [Termux](#termux)
- [Raspberry Pi](#raspberry-pi)
- [yarn, npm](#yarn-npm)
- [macOS](#macos)
- [Standalone Releases](#standalone-releases)
- [Docker](#docker)
- [helm](#helm)
- [Cloud Providers](#cloud-providers)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

This document demonstrates how to install `code-server` on
various distros and operating systems.

## Upgrading

When upgrading you can just install the new version over the old one. code-server
maintains all user data in `~/.local/share/code-server` so that it is preserved in between
installations.

## install.sh

We have a [script](../install.sh) to install code-server for Linux, macOS and FreeBSD.

It tries to use the system package manager if possible.

First run to print out the install process:

```bash
curl -fsSL https://code-server.dev/install.sh | sh -s -- --dry-run
```

Now to actually install:

```bash
curl -fsSL https://code-server.dev/install.sh | sh
```

The script will print out how to run and start using code-server.

If you believe an install script used with `curl | sh` is insecure, please give
[this wonderful blogpost](https://sandstorm.io/news/2015-09-24-is-curl-bash-insecure-pgp-verified-install) by
[sandstorm.io](https://sandstorm.io) a read.

If you'd still prefer manual installation despite the below [detection reference](#detection-reference) and `--dry-run`
then continue on for docs on manual installation. The [`install.sh`](../install.sh) script runs the _exact_ same
commands presented in the rest of this document.

### Flags

- `--dry-run` to echo the commands for the install process without running them.
- `--method` to choose the installation method.
  - `--method=detect` to detect the package manager but fallback to `--method=standalone`.
  - `--method=standalone` to install a standalone release archive into `~/.local`.
- `--prefix=/usr/local` to install a standalone release archive system wide.
- `--version=X.X.X` to install version `X.X.X` instead of latest.
- `--help` to see full usage docs.

### Detection Reference

- For Debian and Ubuntu it will install the latest deb package.
- For Fedora, CentOS, RHEL and openSUSE it will install the latest rpm package.
- For Arch Linux it will install the AUR package.
- For any unrecognized Linux operating system it will install the latest standalone release into `~/.local`.

  - Add `~/.local/bin` to your `$PATH` to run code-server.

- For macOS it will install the Homebrew package.

  - If Homebrew is not installed it will install the latest standalone release into `~/.local`.
  - Add `~/.local/bin` to your `$PATH` to run code-server.

- For FreeBSD, it will install the [npm package](#yarn-npm) with `yarn` or `npm`.

- If ran on an architecture with no releases, it will install the [npm package](#yarn-npm) with `yarn` or `npm`.
  - We only have releases for amd64 and arm64 presently.
  - The [npm package](#yarn-npm) builds the native modules on postinstall.

## Debian, Ubuntu

NOTE: The standalone arm64 .deb does not support Ubuntu <16.04.
Please upgrade or [build with yarn](#yarn-npm).

```bash
curl -fOL https://github.com/cdr/code-server/releases/download/v$VERSION/code-server_$VERSION_amd64.deb
sudo dpkg -i code-server_$VERSION_amd64.deb
sudo systemctl enable --now code-server@$USER
# Now visit http://127.0.0.1:8080. Your password is in ~/.config/code-server/config.yaml
```

## Fedora, CentOS, RHEL, SUSE

NOTE: The standalone arm64 .rpm does not support CentOS 7.
Please upgrade or [build with yarn](#yarn-npm).

```bash
curl -fOL https://github.com/cdr/code-server/releases/download/v$VERSION/code-server-$VERSION-amd64.rpm
sudo rpm -i code-server-$VERSION-amd64.rpm
sudo systemctl enable --now code-server@$USER
# Now visit http://127.0.0.1:8080. Your password is in ~/.config/code-server/config.yaml
```

## Arch Linux

```bash
# Installs code-server from the AUR using yay.
yay -S code-server
sudo systemctl enable --now code-server@$USER
# Now visit http://127.0.0.1:8080. Your password is in ~/.config/code-server/config.yaml
```

```bash
# Installs code-server from the AUR with plain makepkg.
git clone https://aur.archlinux.org/code-server.git
cd code-server
makepkg -si
sudo systemctl enable --now code-server@$USER
# Now visit http://127.0.0.1:8080. Your password is in ~/.config/code-server/config.yaml
```

## Termux

Please see "Installation" in the [Termux docs](./termux.md#installation)

## Raspberry Pi

If you're running a Raspberry Pi, we recommend install code-server with `yarn` or `npm`. See [yarn-npm](#yarn-npm).

## yarn, npm

We recommend installing with `yarn` or `npm` when:

1. You aren't on `amd64` or `arm64`.
2. If you're on Linux with glibc < v2.17 or glibcxx < v3.4.18 on amd64, or glibc < v2.23 or glibcxx < v3.4.21 on arm64.
3. You're running Alpine Linux, or are using a non-glibc libc. See [#1430](https://github.com/cdr/code-server/issues/1430#issuecomment-629883198)

**note:** Installing via `yarn` or `npm` builds native modules on install and so requires C dependencies.
See [./npm.md](./npm.md) for installing these dependencies.

You will need at least node v12 installed. See [#1633](https://github.com/cdr/code-server/issues/1633).

```bash
yarn global add code-server
# Or: npm install -g code-server
code-server
# Now visit http://127.0.0.1:8080. Your password is in ~/.config/code-server/config.yaml
```

## macOS

```bash
brew install code-server
brew services start code-server
# Now visit http://127.0.0.1:8080. Your password is in ~/.config/code-server/config.yaml
```

## Standalone Releases

We publish self contained `.tar.gz` archives for every release on [github](https://github.com/cdr/code-server/releases).
They bundle the node binary and `node_modules`.

These are created from the [npm package](#yarn-npm) and the rest of the releases are created from these.
Only requirement is glibc >= 2.17 && glibcxx >= v3.4.18 on Linux and for macOS there is no minimum system requirement.

1. Download the latest release archive for your system from [github](https://github.com/cdr/code-server/releases).
2. Unpack the release.
3. You can run code-server by executing `./bin/code-server`.

You can add the code-server `bin` directory to your `$PATH` to easily execute `code-server`
without the full path every time.

Here is an example script for installing and using a standalone `code-server` release on Linux:

```bash
mkdir -p ~/.local/lib ~/.local/bin
curl -fL https://github.com/cdr/code-server/releases/download/v$VERSION/code-server-$VERSION-linux-amd64.tar.gz \
  | tar -C ~/.local/lib -xz
mv ~/.local/lib/code-server-$VERSION-linux-amd64 ~/.local/lib/code-server-$VERSION
ln -s ~/.local/lib/code-server-$VERSION/bin/code-server ~/.local/bin/code-server
PATH="~/.local/bin:$PATH"
code-server
# Now visit http://127.0.0.1:8080. Your password is in ~/.config/code-server/config.yaml
```

## Docker

```bash
# This will start a code-server container and expose it at http://127.0.0.1:8080.
# It will also mount your current directory into the container as `/home/coder/project`
# and forward your UID/GID so that all file system operations occur as your user outside
# the container.
#
# Your $HOME/.config is mounted at $HOME/.config within the container to ensure you can
# easily access/modify your code-server config in $HOME/.config/code-server/config.json
# outside the container.
mkdir -p ~/.config
docker run -it --name code-server -p 127.0.0.1:8080:8080 \
  -v "$HOME/.config:/home/coder/.config" \
  -v "$PWD:/home/coder/project" \
  -u "$(id -u):$(id -g)" \
  -e "DOCKER_USER=$USER" \
  codercom/code-server:latest
```

Our official image supports `amd64` and `arm64`.

For `arm32` support there is a popular community maintained alternative:

https://hub.docker.com/r/linuxserver/code-server

## helm

See [the chart](../ci/helm-chart).

## Cloud Providers

We maintain one-click apps and install scripts for different cloud providers such as DigitalOcean, Railway, Heroku, Azure, etc. Check out the repository:

https://github.com/cdr/deploy-code-server
