# npm Install Requirements

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
