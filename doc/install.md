<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# Install

- [install.sh](#installsh)
- [Debian, Ubuntu](#debian-ubuntu)
- [Fedora, CentOS, RHEL, SUSE](#fedora-centos-rhel-suse)
- [Arch Linux](#arch-linux)
- [yarn, npm](#yarn-npm)
- [macOS](#macos)
- [Static Releases](#static-releases)
- [Docker](#docker)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

This document demonstrates how to install `code-server` on
various distros and operating systems.

## install.sh

[We have a script](./install.sh) to install code-server for Linux or macOS.
It tries to use the system package manager if possible.

First run to print out the install process:

```bash
curl -fsSL https://code-server.dev/install.sh | sh  -s -- --dry-run
```

Now to actually install:

```bash
curl -fsSL https://code-server.dev/install.sh | sh
```

The script will print out how to run and start using code-server.

- For Debian, Ubuntu and Raspbian it will install the latest deb package.
- For Fedora, CentOS, RHEL and openSUSE it will install the latest rpm package.
- For Arch Linux it will install the AUR package.
- For any unrecognized Linux operating system it will install the latest static release into `~/.local`

  - Add `~/.local/bin` to your `$PATH` to run code-server.

- For macOS it will install the Homebrew package.

  - If Homebrew is not installed it will install the latest static release into `~/.local`
  - Add ~/.local/bin to your \$PATH to run code-server.

- If ran on an architecture with no binary releases, it will install the npm package with `yarn` or `npm`.
  - We only have binary releases for amd64 and arm64 presently.

Pass `--dry-run` to echo the commands for the install process without running them.

Pass `--static` to install a static release into `~/.local`.

Pass `--static=/usr/local` to install a static release system wide.

Pass `--version=X.X.X` to install version `X.X.X` instead of latest.

Pass `--help` to see full usage docs.

If you believe an install script used via curl is insecure, please give
[this wonderful blogpost](https://sandstorm.io/news/2015-09-24-is-curl-bash-insecure-pgp-verified-install) by
[sandstorm.io](https://sandstorm.io) a read.

If you'd still prefer manual installation despite the above explanations and `--dry-run`
then continue for docs on manual installation. The [`install.sh`](./install.sh) script runs the *exact* same
commands depicted in the rest of this document.

## Debian, Ubuntu

```bash
curl -fOL https://github.com/cdr/code-server/releases/download/v3.3.1/code-server_3.3.1_amd64.deb
sudo dpkg -i code-server_3.3.1_amd64.deb
systemctl --user enable --now code-server
# Now visit http://127.0.0.1:8080. Your password is in ~/.config/code-server/config.yaml
```

## Fedora, CentOS, RHEL, SUSE

```bash
curl -fOL https://github.com/cdr/code-server/releases/download/v3.3.1/code-server-3.3.1-amd64.rpm
sudo rpm -i code-server-3.3.1-amd64.rpm
systemctl --user enable --now code-server
# Now visit http://127.0.0.1:8080. Your password is in ~/.config/code-server/config.yaml
```

## Arch Linux

```bash
# Installs code-server from the AUR using yay.
yay -S code-server
systemctl --user enable --now code-server
# Now visit http://127.0.0.1:8080. Your password is in ~/.config/code-server/config.yaml
```

```bash
# Installs code-server from the AUR with plain makepkg.
git clone https://aur.archlinux.org/code-server.git
cd code-server
makepkg -si
systemctl --user enable --now code-server
# Now visit http://127.0.0.1:8080. Your password is in ~/.config/code-server/config.yaml
```

## yarn, npm

We recommend installing with `yarn` or `npm` if:

1. You aren't using `amd64` or `arm64`.
2. glibc < v2.17

**note:** Installing via `yarn` or `npm` builds native modules on install and so requires C dependencies.
See [./doc/npm.md](./doc/npm.md) for installing these dependencies.

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

## Static Releases

We publish self contained `.tar.gz` archives for every release on [github](https://github.com/cdr/code-server/releases).
They bundle the node binary and node_modules.

1. Download the latest release archive for your system from [github](https://github.com/cdr/code-server/releases).
2. Unpack the release.
3. You can run code-server by executing `./bin/code-server`.

You can add the code-server `bin` directory to your `$PATH` or link to it from a
directory in your `$PATH` to easily execute `code-server` without the full path every time.

Here is an example script for installing and using a static `code-server` release on Linux:

```bash
mkdir -p ~/.local/lib ~/.local/bin
curl -fL https://github.com/cdr/code-server/releases/download/v3.3.1/code-server-3.3.1-linux-amd64.tar.gz \
  | tar -C ~/.local/lib -xz
mv ~/.local/lib/code-server-3.3.1-linux-amd64 ~/.local/lib/code-server-3.3.1
ln -s ~/.local/lib/code-server-3.3.1/bin/code-server ~/.local/bin/code-server
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
docker run -it -p 127.0.0.1:8080:8080 \
  -v "$PWD:/home/coder/project" \
  -u "$(id -u):$(id -g)" \
  codercom/code-server:latest
```

Our official image supports `amd64` and `arm64`.

For `arm32` support there is a highly popular community maintained alternative:

https://hub.docker.com/r/linuxserver/code-server
