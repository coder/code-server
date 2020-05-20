# Install

This document demonstrates how to install `code-server` on
various distros and operating systems.

The steps in this document are exactly what the install script does.

We recommend using the install script if possible. You can run
the install script with the `--dry-run` flag for a dry run which will
print out the commands it will run to install `code-server` but
not run anything. That way you can verify the script is functioning
as intended before installing.

## Debian, Ubuntu

```bash
curl -fOL https://github.com/cdr/code-server/releases/download/v3.3.1/code-server_3.3.1_amd64.deb
sudo dpkg -i code-server_3.3.1_amd64.deb
systemctl --user enable --now code-server
# Now visit http://127.0.0.1:8080. Your password is in ~/.config/code-server/config.yaml
```

## Fedora, CentOS, Red Hat, SUSE

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

We recommend installing with `yarn` or `npm` if we don't have a precompiled release for your machine's
platform or architecture or your glibc < v2.19.

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

Add the code-server `bin` directory to your `$PATH` to easily execute `code-server` without the full path every time.

Here is an example script for installing and using a static `code-server` release on Linux:

```bash
curl -fL https://github.com/cdr/code-server/releases/download/v3.3.1/code-server-3.3.1-linux-amd64.tar.gz \
  | sudo tar -C /usr/local/lib -xz
sudo mv /usr/local/lib/code-server-3.3.1-linux-amd64 /usr/local/lib/code-server-3.3.1
PATH="/usr/local/lib/code-server-3.3.1/bin:$PATH"
code-server
# Now visit http://127.0.0.1:8080. Your password is in ~/.config/code-server/config.yaml
```
