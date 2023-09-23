<!-- prettier-ignore-start -->
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# Install

- [install.sh](#installsh)
  - [Detection reference](#detection-reference)
- [npm](#npm)
- [Standalone releases](#standalone-releases)
- [Debian, Ubuntu](#debian-ubuntu)
- [Fedora, CentOS, RHEL, SUSE](#fedora-centos-rhel-suse)
- [Arch Linux](#arch-linux)
- [Artix Linux](#artix-linux)
- [macOS](#macos)
- [Docker](#docker)
- [Helm](#helm)
- [Windows](#windows)
- [Raspberry Pi](#raspberry-pi)
- [Termux](#termux)
- [Cloud providers](#cloud-providers)
- [Uninstall](#uninstall)
  - [install.sh](#installsh-1)
  - [Homebrew](#homebrew)
  - [npm](#npm-1)
  - [Debian, Ubuntu](#debian-ubuntu-1)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->
<!-- prettier-ignore-end -->

This document demonstrates how to install `code-server` on various distros and
operating systems.

## install.sh

The easiest way to install code-server is to use our [install
script](https://github.com/coder/code-server/blob/main/install.sh) for Linux, macOS and FreeBSD. The install script
[attempts to use the system package manager](#detection-reference) if possible.

You can preview what occurs during the install process:

```bash
curl -fsSL https://code-server.dev/install.sh | sh -s -- --dry-run
```

To install, run:

```bash
curl -fsSL https://code-server.dev/install.sh | sh
```

You can modify the installation process by including one or more of the
following flags:

- `--dry-run`: echo the commands for the install process without running them.
- `--method`: choose the installation method.
  - `--method=detect`: detect the package manager but fallback to
    `--method=standalone`.
  - `--method=standalone`: install a standalone release archive into `~/.local`.
- `--prefix=/usr/local`: install a standalone release archive system-wide.
- `--version=X.X.X`: install version `X.X.X` instead of latest version.
- `--help`: see usage docs.
- `--edge`: install the latest edge version (i.e. pre-release)

When done, the install script prints out instructions for running and starting
code-server.

> If you're concerned about the install script's use of `curl | sh` and the
> security implications, please see [this blog
> post](https://sandstorm.io/news/2015-09-24-is-curl-bash-insecure-pgp-verified-install)
> by [sandstorm.io](https://sandstorm.io).

If you prefer to install code-server manually, despite the [detection
references](#detection-reference) and `--dry-run` feature, then continue on for
information on how to do this. The [`install.sh`](https://github.com/coder/code-server/blob/main/install.sh) script runs the
_exact_ same commands presented in the rest of this document.

### Detection reference

- For Debian and Ubuntu, code-server will install the latest deb package.
- For Fedora, CentOS, RHEL and openSUSE, code-server will install the latest RPM
  package.
- For Arch Linux, code-server will install the AUR package.
- For any unrecognized Linux operating system, code-server will install the
  latest standalone release into `~/.local`.

  - Ensure that you add `~/.local/bin` to your `$PATH` to run code-server.

- For macOS, code-server will install the Homebrew package (if you don't have
  Homebrew installed, code-server will install the latest standalone release
  into `~/.local`).

  - Ensure that you add `~/.local/bin` to your `$PATH` to run code-server.

- For FreeBSD, code-server will install the [npm package](#npm) with `npm`

- If you're installing code-server onto architecture with no releases,
  code-server will install the [npm package](#npm) with `npm`
  - We currently offer releases for amd64 and arm64.
  - The [npm package](#npm) builds the native modules on post-install.

## npm

We recommend installing with `npm` when:

1. You aren't using a machine with `amd64` or `arm64`.
2. You are installing code-server on Windows.
3. You're on Linux with `glibc` < v2.28 or `glibcxx` < v3.4.21.
4. You're running Alpine Linux or are using a non-glibc libc. See
   [#1430](https://github.com/coder/code-server/issues/1430#issuecomment-629883198)
   for more information.

Installing code-server with `npm` builds native modules on install.

This process requires C dependencies; see our guide on [installing with npm](./npm.md) for more information.

## Standalone releases

We publish self-contained `.tar.gz` archives for every release on
[GitHub](https://github.com/coder/code-server/releases). The archives bundle the
node binary and node modules.

We create the standalone releases using the [npm package](#npm), and we
then create the remaining releases using the standalone version.

The only requirement to use the standalone release is `glibc` >= 2.28 and
`glibcxx` >= v3.4.21 on Linux (for macOS, there is no minimum system
requirement).

To use a standalone release:

1. Download the latest release archive for your system from
   [GitHub](https://github.com/coder/code-server/releases).
2. Unpack the release.
3. Run code-server by executing `./bin/code-server`.

You can add `./bin/code-server` to your `$PATH` so that you can execute
`code-server` without providing full path each time.

Here is a sample script for installing and using a standalone code-server
release on Linux:

```bash
mkdir -p ~/.local/lib ~/.local/bin
curl -fL https://github.com/coder/code-server/releases/download/v$VERSION/code-server-$VERSION-linux-amd64.tar.gz \
  | tar -C ~/.local/lib -xz
mv ~/.local/lib/code-server-$VERSION-linux-amd64 ~/.local/lib/code-server-$VERSION
ln -s ~/.local/lib/code-server-$VERSION/bin/code-server ~/.local/bin/code-server
PATH="~/.local/bin:$PATH"
code-server
# Now visit http://127.0.0.1:8080. Your password is in ~/.config/code-server/config.yaml
```

## Debian, Ubuntu

> The standalone arm64 .deb does not support Ubuntu 16.04 or earlier. Please
> upgrade or [build with npm](#npm).

```bash
curl -fOL https://github.com/coder/code-server/releases/download/v$VERSION/code-server_${VERSION}_amd64.deb
sudo dpkg -i code-server_${VERSION}_amd64.deb
sudo systemctl enable --now code-server@$USER
# Now visit http://127.0.0.1:8080. Your password is in ~/.config/code-server/config.yaml
```

## Fedora, CentOS, RHEL, SUSE

> The standalone arm64 .rpm does not support CentOS 7. Please upgrade or [build
> with npm](#npm).

```bash
curl -fOL https://github.com/coder/code-server/releases/download/v$VERSION/code-server-$VERSION-amd64.rpm
sudo rpm -i code-server-$VERSION-amd64.rpm
sudo systemctl enable --now code-server@$USER
# Now visit http://127.0.0.1:8080. Your password is in ~/.config/code-server/config.yaml
```

## Arch Linux

```bash
# Install code-server from the AUR using yay.
yay -S code-server
sudo systemctl enable --now code-server@$USER
# Now visit http://127.0.0.1:8080. Your password is in ~/.config/code-server/config.yaml
```

```bash
# Install code-server from the AUR with plain makepkg.
git clone https://aur.archlinux.org/code-server.git
cd code-server
makepkg -si
sudo systemctl enable --now code-server@$USER
# Now visit http://127.0.0.1:8080. Your password is in ~/.config/code-server/config.yaml
```

## Artix Linux

```bash
# Install code-server from the AUR
git clone https://aur.archlinux.org/code-server.git
cd code-server
makepkg -si
```

Save the file as `code-server` in `/etc/init.d/` and make it executable with `chmod +x code-server`. Put your username in line 3.

```bash
#!/sbin/openrc-run
name=$RC_SVCNAME
description="$name - VS Code on a remote server"
user="" # your username here
homedir="/home/$user"
command="$(which code-server)"
# Just because you can do this does not mean you should. Use ~/.config/code-server/config.yaml instead
#command_args="--extensions-dir $homedir/.local/share/$name/extensions --user-data-dir $homedir/.local/share/$name --disable-telemetry"
command_user="$user:$user"
pidfile="/run/$name/$name.pid"
command_background="yes"
extra_commands="report"

depend() {
  use logger dns
  need net
}

start_pre() {
  checkpath --directory --owner $command_user --mode 0755 /run/$name /var/log/$name
}

start() {
  default_start
  report
}

stop() {
  default_stop
}

status() {
  default_status
  report
}

report() {
  # Report to the user
  einfo "Reading configuration from ~/.config/code-server/config.yaml"
}
```

Start on boot with default runlevel

```
rc-update add code-server default
```

Start the service immediately

```
rc-service code-server start
```

## macOS

```bash
brew install code-server
brew services start code-server
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
  -v "$HOME/.local:/home/coder/.local" \
  -v "$HOME/.config:/home/coder/.config" \
  -v "$PWD:/home/coder/project" \
  -u "$(id -u):$(id -g)" \
  -e "DOCKER_USER=$USER" \
  codercom/code-server:latest
```

Our official image supports `amd64` and `arm64`. For `arm32` support, you can
use a [community-maintained code-server
alternative](https://hub.docker.com/r/linuxserver/code-server).

## Helm

You can install code-server using the [Helm package manager](https://coder.com/docs/code-server/latest/helm).

## Windows

We currently [do not publish Windows
releases](https://github.com/coder/code-server/issues/1397). We recommend
installing code-server onto Windows with [`npm`](#npm).

## Raspberry Pi

We recommend installing code-server onto Raspberry Pi with [`npm`](#npm).

If you see an error related to `node-gyp` during installation, See [#5174](https://github.com/coder/code-server/issues/5174) for more information.

## Termux

Please see code-server's [Termux docs](./termux.md#installation) for more
information.

## Cloud providers

We maintain [one-click apps and install scripts for cloud
providers](https://github.com/coder/deploy-code-server) such as DigitalOcean,
Railway, Heroku, and Azure.

## Uninstall

code-server can be completely uninstalled by removing the application directory, and your user configuration directory.

To delete settings and data:

```shell
rm -rf ~/.local/share/code-server ~/.config/code-server
```

### install.sh

If you installed with the install script, by default code-server will be in `~/.local/lib/code-server-<version>` and you can remove it with `rm -rf`. e.g.

```shell
rm -rf ~/.local/lib/code-server-*
```

### Homebrew

To remove the code-server homebrew package, run:

```shell
brew remove code-server

# Alternatively
brew uninstall code-server
```

### npm

To remove the code-server global module, run:

```shell
npm uninstall --global code-server
```

### Debian, Ubuntu

To uninstall, run:

```shell
sudo apt remove code-server
```
