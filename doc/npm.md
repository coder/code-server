<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# npm Install Requirements

- [Ubuntu, Debian](#ubuntu-debian)
- [Fedora, CentOS, RHEL](#fedora-centos-rhel)
- [macOS](#macos)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

If you're installing the npm module you'll need certain dependencies to build
the native modules used by VS Code.

You also need at least node v12 installed. See [#1633](https://github.com/cdr/code-server/issues/1633).

## Ubuntu, Debian

```bash
sudo apt-get install -y \
  build-essential \
  pkg-config \
  libx11-dev \
  libxkbfile-dev \
  libsecret-1-dev
```

## Fedora, CentOS, RHEL

```bash
sudo yum groupinstall -y 'Development Tools'
sudo yum config-manager --set-enabled PowerTools # unnecessary on CentOS 7
sudo yum install -y python2 libsecret-devel libX11-devel libxkbfile-devel
npm config set python python2
```

## macOS

Install [Xcode](https://developer.apple.com/xcode/downloads/) and run:

```bash
xcode-select --install
```
