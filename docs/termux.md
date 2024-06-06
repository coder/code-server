<!-- prettier-ignore-start -->
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# Termux

- [Install](#install)
- [NPM Installation](#npm-installation)
- [Upgrade](#upgrade)
- [Known Issues](#known-issues)
  - [Git won't work in `/sdcard`](#git-wont-work-in-sdcard)
  - [Many extensions including language packs fail to install](#many-extensions-including-language-packs-fail-to-install)
- [Extra](#extra)
  - [Keyboard Shortcuts and Tab Key](#keyboard-shortcuts-and-tab-key)
  - [Create a new user](#create-a-new-user)
  - [Install Go](#install-go)
  - [Install Python](#install-python)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->
<!-- prettier-ignore-end -->

## Install

1. Get [Termux](https://f-droid.org/en/packages/com.termux/) from **F-Droid**.
2. Run `pkg install tur-repo`
3. Run `pkg install code-server`
4. You can now start code server by simply running `code-server`.

## NPM Installation

1. Get [Termux](https://f-droid.org/en/packages/com.termux/) from **F-Droid**.

2. We will now change using the following command.

```sh
termux-change-repo
```

Now select `Main Repository` then change repo to `Mirrors by Grimler Hosted on grimler.se`.

3. After successfully updating of repository update and upgrade all the packages by the following command

```sh
pkg update
pkg upgrade -y
```

4. Now let's install requirement dependancy.

```sh
pkg install -y \
  build-essential \
  binutils \
  pkg-config \
  python3 \
  nodejs-lts
npm config set python python3
node -v
```

you will get Node version `v20`

5. Now install code-server following our guide on [installing with npm](./npm.md)

6. Congratulation code-server is installed on your device using the following command.

```sh
code-server --auth none
```

7. If already installed then use the following command for upgradation.

```
npm update --global code-server
```

## Upgrade

1. Remove all previous installs `rm -rf ~/.local/lib/code-server-*`
2. Run the install script again `curl -fsSL https://code-server.dev/install.sh | sh`

## Known Issues

### Git won't work in `/sdcard`

Issue : Using git in the `/sdcard` directory will fail during cloning/commit/staging/etc...\
Fix : None\
Potential Workaround :

1. Create a soft-link from the debian-fs to your folder in `/sdcard`
2. Use git from termux (preferred)

### Many extensions including language packs fail to install

Issue: Android is not seen as a Linux environment but as a separate, unsupported platform, so code-server only allows [Web Extensions](https://code.visualstudio.com/api/extension-guides/web-extensions), refusing to download extensions that run on the server.\
Fix: None\
Potential workarounds :

Either

- Manually download extensions as `.vsix` file and install them via `Extensions: Install from VSIX...` in the Command Palette.

- Use an override to pretend the platform is Linux:

Create a JS script that patches `process.platform`:

```js
// android-as-linux.js
Object.defineProperty(process, "platform", {
  get() {
    return "linux"
  },
})
```

Then use Node's `--require` option to make sure it is loaded before `code-server` starts:

```sh
NODE_OPTIONS="--require /path/to/android-as-linux.js" code-server
```

⚠️ Note that Android and Linux are not 100% compatible, so use these workarounds at your own risk. Extensions that have native dependencies other than Node or that directly interact with the OS might cause issues.

## Extra

### Keyboard Shortcuts and Tab Key

In order to support the tab key and use keyboard shortcuts, add this to your
settings.json:

```json
{
  "keyboard.dispatch": "keyCode"
}
```

### Create a new user

To create a new user follow these simple steps -

1. Create a new user by running `useradd <username> -m`.
2. Change the password by running `passwd <username>`.
3. Give your new user sudo access by running `visudo`, scroll down to `User privilege specification` and add the following line after root `username ALL=(ALL:ALL) ALL`.
4. Now edit the `/etc/passwd` file with your command line editor of choice and at the end of the line that specifies your user change `/bin/sh` to `/bin/bash`.
5. Now switch users by running `su - <username>`

- Remember the `-` betweeen `su` and username is required to execute `/etc/profile`,\
  since `/etc/profile` may have some necessary things to be executed you should always add a `-`.

### Install Go

> From https://golang.org/doc/install

1. Go to https://golang.org/dl/ and copy the download link for `linux arm` and run the following:

```bash
wget download_link
```

2. Extract the downloaded archive. (This step will erase all previous GO installs, make sure to create a backup if you have previously installed GO)

```bash
rm -rf /usr/local/go && tar -C /usr/local -xzf archive_name
```

3. Run `nano /etc/profile` and add the following line `export PATH=$PATH:/usr/local/go/bin`.
4. Now run `exit` (depending on if you have switched users or not, you may have to run `exit` multiple times to get to normal termux shell) and start Debian again.
5. Check if your install was successful by running `go version`

### Install Python

> Run these commands as root

1. Run the following commands to install required packages to build python:

```bash
sudo apt-get update
sudo apt-get install make build-essential libssl-dev zlib1g-dev \
  libbz2-dev libreadline-dev libsqlite3-dev wget curl llvm \
  libncursesw5-dev xz-utils tk-dev libxml2-dev libxmlsec1-dev libffi-dev liblzma-dev
```

2. Install [pyenv](https://github.com/pyenv/pyenv/) from [pyenv-installer](https://github.com/pyenv/pyenv-installer) by running:

```bash
curl -L https://github.com/pyenv/pyenv-installer/raw/master/bin/pyenv-installer | bash
```

3. Run `nano /etc/profile` and add the following:

```bash
export PYENV_ROOT="/root/.pyenv"
export PATH="/root/.pyenv/bin:$PATH"
eval "$(pyenv init --path)"
eval "$(pyenv virtualenv-init -)"
```

4. Exit and start Debian again.
5. Run `pyenv versions` to list all installable versions.
6. Run `pyenv install version` to install the desired python version.
   > The build process may take some time (an hour or 2 depending on your device).
7. Run `touch /root/.pyenv/version && echo "your_version_here" > /root/.pyenv/version`
8. (You may have to start Debian again) Run `python3 -V` to verify if PATH works or not.
   > If `python3` doesn't work but pyenv says that the install was successful in step 6 then try running `$PYENV_ROOT/versions/your_version/bin/python3`.
