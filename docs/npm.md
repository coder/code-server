<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# npm Package Installation Requirements

- [npm Package Installation Requirements](#npm-package-installation-requirements)
  - [Debian, Ubuntu](#debian-ubuntu)
  - [CentOS, Fedora, RHEL](#centos-fedora-rhel)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

This article shows you how to install the npm package required when [installing code-server](./install.md#yarn-npm) onto a machine with architecture for which we don't offer a designated release. The npm package builds the native modules used by VS Code.

Before proceeding, please make sure that you have Node.js version 12.x (or later) installed.

## Debian, Ubuntu

To install the npm package on a machine running Debian or Ubuntu:

```bash
sudo apt-get install -y \
  build-essential \
  pkg-config \
  libx11-dev \
  libxkbfile-dev \
  libsecret-1-dev \
  python3
npm config set python python3
```

## CentOS, Fedora, RHEL

To install the npm package on a machine running CentOS, Fedora, or RHEL:

```bash
sudo yum groupinstall -y 'Development Tools'
sudo yum config-manager --set-enabled PowerTools # unnecessary on CentOS 7
sudo yum install -y python2 libsecret-devel libX11-devel libxkbfile-devel
npm config set python python2
```
