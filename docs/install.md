<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# Install

- [Install](#install)
  - [Minimum Requirements](#minimum-requirements)
  - [Quick Install](#quick-install)
  - [Manual Installation](#manual-installation)
    - [Flags](#flags)
    - [Detection Reference](#detection-reference)
    - [Debian, Ubuntu](#debian-ubuntu)
    - [Fedora, CentOS, RHEL, SUSE](#fedora-centos-rhel-suse)
    - [Arch Linux](#arch-linux)
    - [macOS](#macos)
    - [yarn, npm](#yarn-npm)
  - [Standalone Releases](#standalone-releases)
    - [Requirements](#requirements)
    - [Installation](#installation)
    - [Sample Installation Script](#sample-installation-script)
    - [Docker](#docker)
  - [Alternatives](#alternatives)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

This document will should you how to install code-server for your distro/operating system.

## Minimum Requirements

You can run code-server on a machine in your possession or using a virtual machine hosted by Google, Amazon, etc.

We recommend the following as a minimum:

- 1 GB of RAM
- 2 CPU cores

## Quick Install

We offer an [install script](./install.sh) for Linux, macOS, and FreeBSD; the script uses the system package manager (if possible).

You can see what occurs during the install process by running the following (there are no file changes at this point):

```bash
curl -fsSL https://code-server.dev/install.sh | sh -s -- --dry-run
```

To install, run:

```bash
curl -fsSL https://code-server.dev/install.sh | sh
```

When done, the install script prints out instructions for running and starting code-server.

See also our guide for [setup and configuration instructions](./docs/guide.md).

**Note:** We recommend that those who object to the use of `curl | sh` by the install script read [this blog post](https://sandstorm.io/news/2015-09-24-is-curl-bash-insecure-pgp-verified-install) by
[Sandstorm](https://sandstorm.io). If you'd still prefer a manual installation process, please proceed with the remainder of this document.

## Manual Installation

The following are distro/operating-system-specific guides to installing code-server.

### Flags

You may see one or more of the following flags used during the installation process:

- `--dry-run`: echo the commands for the install process without running them
- `--method`: choose the installation method.
  - `--method=detect`: detect the package manager (if unable, it falls back to `--method=standalone`)
  - `--method=standalone`: install a standalone release archive into `~/.local`.
- `--prefix=/usr/local`: install a standalone release archive systemwide
- `--version=X.X.X`: install version `X.X.X` instead of the latest version
- `--help`: see usage docs

### Detection Reference

During the code-server installation process, the following packages will be installed if they're not already.

- For Debian, Ubuntu, and Raspbian, code-server installs the latest deb package
- For Fedora, CentOS, RHEL, and openSUSE, code-server installs the latest RPM package
- For Arch Linux, code-server installs the AUR package
- For any unrecognized Linux operating system, code-server installs the latest standalone release into `~/.local`. Make sure that you add `~/.local/bin` to your `$PATH` to run code-server.
- For macOS code-server installs Homebrew to `~/.local`. Make sure that you add `~/.local/bin` to your `$PATH` to run code-server.
- For FreeBSD, code-server installs the [npm package](#yarn-npm) with `yarn` or `npm`
- If you run code-server on architecture with no releases, it installs the [npm package](#yarn-npm) with `yarn` or `npm`. The [npm package](#yarn-npm) builds the native modules on post-install. Please note that we have releases only for **amd64** and **arm64**.

### Debian, Ubuntu

```bash
curl -fOL https://github.com/cdr/code-server/releases/download/v3.6.0/code-server_3.6.0_amd64.deb
sudo dpkg -i code-server_3.6.0_amd64.deb
sudo systemctl enable --now code-server@$USER
# Now visit http://127.0.0.1:8080.
# Your password is in ~/.config/code-server/config.yaml
```

### Fedora, CentOS, RHEL, SUSE

```bash
curl -fOL https://github.com/cdr/code-server/releases/download/v3.6.0/code-server-3.6.0-amd64.rpm
sudo rpm -i code-server-3.6.0-amd64.rpm
sudo systemctl enable --now code-server@$USER
# Now visit http://127.0.0.1:8080. Your password is in ~/.config/code-server/config.yaml
```

### Arch Linux

To install code-server onto a workstation running Arch Linux using [yay](https://aur.archlinux.org/packages/yay/):

```bash
# Installs code-server from the AUR using yay.
yay -S code-server
sudo systemctl enable --now code-server@$USER
# Now visit http://127.0.0.1:8080. Your password is in ~/.config/code-server/config.yaml
```

Alternatively, you can use [makepkg](https://wiki.archlinux.org/index.php/Makepkg):

```bash
# Installs code-server from the AUR with plain makepkg.
git clone https://aur.archlinux.org/code-server.git
cd code-server
makepkg -si
sudo systemctl enable --now code-server@$USER
# Now visit http://127.0.0.1:8080. Your password is in ~/.config/code-server/config.yaml
```

### macOS

```bash
brew install code-server
brew services start code-server
# Now visit http://127.0.0.1:8080. Your password is in ~/.config/code-server/config.yaml
```

### yarn, npm

You can install code-server using Yarn or npm. We recommend doing so if:

1. Your operating system doesn't use `amd64` or `arm64` architecture.
2. You're on Linux with glibc version v2.17 (or earlier) or glibcxx version v3.4.18 (or earlier)

Notes:

- Installing code-server using Yarn or npm builds native modules on install, which requires [C dependencies](./npm.md) for install
- You must have Node.js version 12.x (or greater) installed
- If you're running macOS, install [Xcode](https://developer.apple.com/xcode/downloads/) and run `xcode-select --install` before proceeding with the installation.

To install code-server using Yarn/npm:

```bash
yarn global add code-server
# Or: npm install -g code-server
code-server
# Now visit http://127.0.0.1:8080. Your password is in ~/.config/code-server/config.yaml
```

## Standalone Releases

For every release, we publish [self-contained .tar.gz archives](https://github.com/cdr/code-server/releases) that bundle the Node binary and modules.

The base for these were created from the [npm package](#yarn-npm); we've created all subsequent releases using this base.

### Requirements

For Linux, you must be running glibc >= 2.17 and glibcxx >= v3.4.18.

There are no minimum system requirements for macOS.

### Installation

1. [Download](https://github.com/cdr/code-server/releases) the latest release archive for your system
2. Unpack the release
3. Run code-server by executing `./bin/code-server`

To use code-server, point your browser to **http://127.0.0.1:8080**. You can find your password in **~/.config/code-server/config.yaml**.

If you'd like to run code-server without providing the full path, add the code-server `bin` directory to your `$PATH`.

### Sample Installation Script

The following is a sample script of how to install and use a standalone code-server release on a Linux workstation:

```bash
mkdir -p ~/.local/lib ~/.local/bin
curl -fL https://github.com/cdr/code-server/releases/download/v3.6.0/code-server-3.6.0-linux-amd64.tar.gz \
  | tar -C ~/.local/lib -xz
mv ~/.local/lib/code-server-3.6.0-linux-amd64 ~/.local/lib/code-server-3.6.0
ln -s ~/.local/lib/code-server-3.6.0/bin/code-server ~/.local/bin/code-server
PATH="~/.local/bin:$PATH"
code-server
# Now visit http://127.0.0.1:8080. Your password is in ~/.config/code-server/config.yaml
```

### Docker

The following script shows how you can start and expose a code-server container:

```bash
# This will start a code-server container and expose
# it at http://127.0.0.1:8080.
#
# It will mount your current directory into the container
# as `/home/coder/project` and forward your UID/GID
# so that all file system operations occur as your user
# outside the container.
#
# Your $HOME/.config is mounted at $HOME/.config within
# the container to ensure you can access/modify your
# code-server config in $HOME/.config/code-server/config.json
# outside the container.

mkdir -p ~/.config
docker run -it --name code-server -p 127.0.0.1:8080:8080 \
  -v "$HOME/.config:/home/coder/.config" \
  -v "$PWD:/home/coder/project" \
  -u "$(id -u):$(id -g)" \
  -e "DOCKER_USER=$USER" \
  codercom/code-server:latest
```

## Alternatives

Our official code-server image supports `amd64` and `arm64` architectures, but if you're using `arm32`, there is a [community-maintained alternative](https://hub.docker.com/r/linuxserver/code-server)
