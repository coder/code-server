<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# Termux

- [Install](#install)
- [NPM Installation](#npm-installation)
- [Upgrade](#upgrade)
- [Known Issues](#known-issues)
  - [Git won't work in `/sdcard`](#git-wont-work-in-sdcard)
- [Extra](#extra)
  - [Create a new user](#create-a-new-user)
  - [Install Go](#install-go)
  - [Install Python](#install-python)
  - [Working with PRoot](#working-with-proot)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Install

1. Get [Termux](https://f-droid.org/en/packages/com.termux/) from **F-Droid**.
2. Install Debian by running the following:
   - Run `termux-setup-storage` to allow storage access, or else code-server won't be able to read from `/sdcard`.\
     > The following command is from [proot-distro](https://github.com/termux/proot-distro), but you can also use [Andronix](https://andronix.app/).
     > After Debian is installed the `~ $` will change to `root@localhost`.

```bash
pkg update -y && pkg install proot-distro -y && proot-distro install debian && proot-distro login debian
```

3. Run the following commands to setup Debian:

```bash
apt update && apt upgrade -y && apt-get install sudo vim git -y
```

4. Install [NVM](https://github.com/nvm-sh/nvm#install--update-script) by following the install guide in the README, just a curl/wget command.

5. Set up NVM for multi-user. After installing NVM it automatically adds the necessary commands for it to work, but it will only work if you are logged in as root:

   - Copy the lines NVM asks you to run after running the install script.
   - Run `nano /root/.bashrc` and comment out those lines by adding a `#` at the start.
   - Run `nano /etc/profile` and paste those lines at the end of the file. Make sure to replace `$HOME` with `/root` on the first line.
   - Now run `exit`
   - Start Debian again `proot-distro login debian`

6. After following the instructions and setting up NVM you can now install the [required node version](https://coder.com/docs/code-server/latest/npm#nodejs-version) by running:

```bash
nvm install v<major_version_here>
```

7. To install `code-server` run the following:
   > To check the install process (Will not actually install code-server)
   > If it all looks good, you can install code-server by running the second command

```bash
curl -fsSL https://code-server.dev/install.sh | sh -s -- --dry-run
```

```bash
curl -fsSL https://code-server.dev/install.sh | sh
```

8. You can now start code server by simply running `code-server`.

> Consider using a new user instead of root, read [here](https://www.howtogeek.com/124950/htg-explains-why-you-shouldnt-log-into-your-linux-system-as-root/) why using root is not recommended.\
> Learn how to add a user [here](#create-a-new-user).

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

you will get node version `v16.15.0`

5. Now install code-server following our guide on [installing with npm](./npm.md)

6. Congratulation code-server is installed on your device using the following command.

```sh
code-server --auth none
```

7. If already installed then use the following command for upgradation.

```
npm update --global code-server --unsafe-perm
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

## Extra

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

### Working with PRoot

Debian PRoot Distro Dev Environment

- Since Node and code-server are installed in the Debian PRoot distro, your `~/.ssh/` configuration, `~/.bashrc`, git, npm packages, etc. should be setup in PRoot as well.
- The terminal accessible in code-server will bring up the filesystem and `~/.bashrc` in the Debian PRoot distro.

Accessing files in the Debian PRoot Distro

- The `/data/data/com.termux/files/home` directory in PRoot accesses the termux home directory (`~`)
- The `/sdcard` directory in PRoot accesses the Android storage directory, though there are [known issues with git and files in the `/sdcard` path](#git-wont-work-in-sdcard)

Accessing the Debian PRoot distro/Starting code-server

- Run the following command to access the Debian PRoot distro, from the termux shell:

```bash
proot-distro login debian
```

- Run the following command to start code-server directly in the Debian PRoot distro, from the termux shell:

```bash
proot-distro login debian -- code-server
```

- If you [created a new user](#create-a-new-user), you'll need to insert the `--user <username>` option between `login` and `debian` in the commands above to run as the user instead of root in PRoot.

Additional information on PRoot and Termux

- Additional information on using your Debian PRoot Distro can be [found here](https://github.com/termux/proot-distro#functionality-overview).
