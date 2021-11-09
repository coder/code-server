<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# Termux

- [Install](#install)
- [Upgrade](#upgrade)
- [Known Issues](#known-issues)
  - [Search doesn't work](#search-doesnt-work)
  - [Backspace doesn't work](#backspace-doesnt-work)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

### Install

1. Get [Termux](https://f-droid.org/en/packages/com.termux/) from **F-Droid**.
2. Install Debian by running the following.
    - Also run `termux-setup-storage` to allow storage access or else code-server won't be able to read from `/sdcard/`.\
    If you used the Andronix command \\/ then you may have to edit the `start-debian.sh` script to mount `/sdcard` just as simple as uncommenting the `command+=" -b /sdcard"` line.
> The following command was extracted from [Andronix](https://andronix.app/) you can also use [proot-distro](https://github.com/termux/proot-distro).
```bash
pkg update -y && pkg install wget curl proot tar -y && wget https://raw.githubusercontent.com/AndronixApp/AndronixOrigin/master/Installer/Debian/debian.sh -O debian.sh && chmod +x debian.sh && bash debian.sh
```
> After Debian is installed the `~ $` will change to `root@localhost`.
3. Run the following commands to setup Debian.
```bash
apt update
apt upgrade -y
apt-get install nano vim sudo curl wget git -y
```
4. Then create a new user to use later and change its password.
```bash
useradd username -m
passwd username
```
5. Install [NVM](https://github.com/nvm-sh/nvm) by following the install guide in the README, just a curl/wget command.
6. Set up NVM for multi-user. After installing NVM it automatically adds the necessary commands for it to work but it will only work if you are logged in as root which we do not want (see step 9) so do the following things.
    - Copy the lines NVM asks you to run after running the install script.
    - Run `nano /root/.bashrc` and comment out those lines by adding a `#` at the start.
    - Run `nano /etc/profile` and paste those lines at the end and make sure to replace `$HOME` with `/root`
    - Now run `exit` and start Debain again.

7. After following the instructions and setting up NVM you can now install the [required node version](https://coder.com/docs/code-server/latest/npm#nodejs-version) using `nvm install version_here`.
8. You don't need to install yarn.
9. Now you are ready to install code server but first lets switch users.
    - There are many answers on Stack Exchange for why logging in as root is not recommended,\
    but heres a [short article](https://www.howtogeek.com/124950/htg-explains-why-you-shouldnt-log-into-your-linux-system-as-root/) for you.
    - Run the following `visudo` to give your user (created in step 4) sudo privileges.
    - After executing the command scroll to `User privilege specification` and add `username ALL=(ALL:ALL) ALL`.
10. To switch users run `su - username`. **DO NOT forget to add the `-` between `su` and the username or else the `/etc/profile` file won't be executed,** you may instead follow step 6 but edit the `/etc/bash.bashrc` file intead of `/etc/profile` if you don't want to add a `-` between `su` and username.

11. To install `code-server` run the following.

To check the install process (Will not actually install code-server)
```bash
curl -fsSL https://code-server.dev/install.sh | sh -s -- --dry-run
```
Now if all looks good you can run to install code-server.
```bash
curl -fsSL https://code-server.dev/install.sh | sh
```
12. Now everytime you run `./start-debian.sh` (or `proot-distro login debian` if you used proot-distro) you can switch to your user `su - username` and run code-server.

### Upgrade

1. Remove all previous installs `rm -rf ~/.local/lib/code-server-*`
2. Run the install script again `curl -fsSL https://code-server.dev/install.sh | sh`

### Known Issues

#### Git won't work in `/sdcard`

Issue : Using git in the `/sdcard` directory will fail during cloning/commit/staging/etc...\
Fix : None\
Potential Workaround : 
1. Create a soft-link from the debian-fs to your folder in `/sdcard`
2. Use git from termux (preferred)

### Extra

#### Install GO

> From https://golang.org/doc/install

1. Go to https://golang.org/dl/ and copy the downloadlink for `linux arm` and run the following.
```bash
wget download_link
```
2. Extract the downloaded archive. (This step will erase all previous GO installs make sure to create a backup if you have previously installed GO)
```bash
rm -rf /usr/local/go && tar -C /usr/local -xzf archive_name
```
3. Run `nano /etc/profile` and add the following line `export PATH=$PATH:/usr/local/go/bin`.
4. Now run `exit` (depending on if you have switched users or not you may have to run `exit` multiple times to get to normal termux shell) and start Debian again.
5. Check if your install was successful by running `go version`

#### Install Python

> Run these commands as root

1. Run the following command to install required packages to build python.
```bash
sudo apt-get update; sudo apt-get install make build-essential libssl-dev zlib1g-dev \
libbz2-dev libreadline-dev libsqlite3-dev wget curl llvm \
libncursesw5-dev xz-utils tk-dev libxml2-dev libxmlsec1-dev libffi-dev liblzma-dev
```
2. Install [pyenv](https://github.com/pyenv/pyenv/) from [pyenv-installer](https://github.com/pyenv/pyenv-installer) by running.
```bash
curl -L https://github.com/pyenv/pyenv-installer/raw/master/bin/pyenv-installer | bash
```
3. Run `nano /etc/profile` and add the following
```bash
export PYENV_ROOT="/root/.pyenv"
export PATH="$HOME/.pyenv/bin:$PATH"
eval "$(pyenv init --path)"
eval "$(pyenv virtualenv-init -)"
```
4. Exit start Debian again.
5. Run `pyenv versions` to list all installable versions.
6. Run `pyenv install version` to install the desired python version.
> The build process may take some time (an hour or 2 depending on your device).
7. Run `touch /root/.pyenv/version && echo "your_version_here" > /root/.pyenv/version`
8. (You may have to start Debian again) Run `python3 -V` to verify if PATH works or not.
> If `python3` doesnt work but pyenv says thst the install was successfull in step 6 then try running `$PYENV_ROOT/versions/your_version/bin/python3`.
9. You can now swith users by `su - username` and try runnning `python3 -V` and `pip -V` to check if it works or not.
