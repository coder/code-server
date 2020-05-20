#!/bin/sh
set -eu

VERSION=3.3.1

usage() {
  cat << EOF
$0 [-d] [-s] [-p <static-install-prefix>]

Installs code-server on any macOS or Linux system.

If ran on Ubuntu, Debian or Raspbian then the GitHub releases v$VERSION
deb package will be fetched and installed.

If ran on Fedora, CentOS, RHEL or openSUSE then the GitHub releases v$VERSION
rpm package will be fetched and installed.

If ran on macOS and Homebrew is installed then the Homebrew code-server
package will be installed. However, if Homebrew is not installed then
v$VERSION of the macOS static release will be installed
into /usr/local/lib/code-server-$VERSION.

If ran on Arch Linux, then the code-server AUR package will be installed.

If ran on an unsupported architecture the npm package will be installed
with yarn or npm. Only amd64 and arm64 are currently supported.

If ran on any other Linux distro, v$VERSION of the linux static release
will be installed into /usr/local/lib/code-server-$VERSION.

  -d Enables a dry run where where the steps that would have taken place
     are printed but do not actually execute.

  -s Forces the installation of a static release into /usr/local/lib/code-server-$VERSION
     Set the -p flag to change the installation prefix from /usr/local/lib

  -p Sets the installation prefix for a static release install.
EOF
  exit 1
}

echo_static_postinstall() {
  echo
  cat << EOF
Static release has been installed into $STATIC_INSTALL_PREFIX/code-server-$VERSION
Please extend your path to use code-server:
  PATH="$STATIC_INSTALL_PREFIX/code-server-$VERSION/bin:\$PATH"
Then you can run:
  code-server
EOF
}

echo_systemd_postinstall() {
  echo
  cat << EOF
To have systemd start code-server now and restart on boot:
  systemctl --user enable --now code-server
Or, if you don't want/need a background service you can run:
  code-server
EOF
}

main() {
  unset DRY_RUN STATIC STATIC_INSTALL_PREFIX SKIP_LOG
  while getopts ":dsp:h" opt; do
    case "$opt" in
    d) DRY_RUN=1 ;;
    s) STATIC=1 ;;
    p) STATIC_INSTALL_PREFIX="$OPTARG" ;;
    h | ?) usage ;;
    esac
  done
  shift $((OPTIND - 1))

  OS="$(os)"
  if [ ! "$OS" ]; then
    echo "Unsupported OS $(uname)."
    exit 1
  fi

  distro_name

  ARCH="$(arch)"
  if [ ! "$ARCH" ]; then
    if [ "${STATIC-}" ]; then
      echo "No static releases available for the architecture $(uname -m)."
      echo "Please rerun without the -s flag to install from npm."
      exit 1
    fi
    install_npm
    exit 0
  fi

  CACHE_DIR="$(cache_dir)"
  mkdir -p "$CACHE_DIR"

  if [ "${STATIC-}" ]; then
    install_static
    return
  fi

  case "$(distro)" in
  macos)
    install_macos
    ;;
  ubuntu | debian | raspbian)
    install_deb
    ;;
  centos | fedora | rhel | opensuse)
    install_rpm
    ;;
  arch)
    install_arch
    ;;
  *)
    install_static
    ;;

  esac
}

install_macos() {
  if command_exists brew; then
    echo "Installing from Homebrew."

    sh_c brew install code-server

    return
  fi

  echo "Homebrew is not installed so installing static release."

  install_static
}

fetch() {
  URL="$1"
  FILE="$2"

  if [ -e "$FILE" ]; then
    echo
    echo "+ Using cached $FILE from $URL"
    return
  fi

  sh_c curl \
    -#fL \
    -Ro "$FILE.incomplete" \
    -C - \
    "$URL"
  mv "$FILE.incomplete" "$FILE"
}

install_deb() {
  echo "Installing v$VERSION deb package from GitHub releases."

  fetch "https://github.com/cdr/code-server/releases/download/v$VERSION/code-server_${VERSION}_$ARCH.deb" "$CACHE_DIR/code-server_${VERSION}_$ARCH.deb"
  sudo_sh_c dpkg -i "$CACHE_DIR/code-server_${VERSION}_$ARCH.deb"

  echo_systemd_postinstall
}

install_rpm() {
  echo "Installing v$VERSION rpm package from GitHub releases."

  fetch "https://github.com/cdr/code-server/releases/download/v$VERSION/code-server-$VERSION-$ARCH.rpm" "$CACHE_DIR/code-server-$VERSION-$ARCH.rpm"
  sudo_sh_c rpm -i "$CACHE_DIR/code-server-$VERSION-$ARCH.rpm"

  echo_systemd_postinstall
}

install_arch() {
  echo "Installing from the AUR."

  fetch "https://aur.archlinux.org/cgit/aur.git/snapshot/code-server.tar.gz" "$CACHE_DIR/code-server-aur.tar.gz"

  tmp_dir="$(mktemp -d)"
  (
    cd "$tmp_dir"
    tar -xzf "$CACHE_DIR/code-server-aur.tar.gz" --strip-components 1
    sh_c makepkg -si
  )
  rm -Rf "$tmp_dir"

  echo_systemd_postinstall
}

install_static() {
  STATIC_INSTALL_PREFIX=${STATIC_INSTALL_PREFIX-/usr/local/lib}

  echo "Installing static release v$VERSION"

  fetch "https://github.com/cdr/code-server/releases/download/v$VERSION/code-server-$VERSION-$OS-$ARCH.tar.gz" "$CACHE_DIR/code-server-$VERSION-$OS-$ARCH.tar.gz"

  if [ ! -d "$STATIC_INSTALL_PREFIX" ]; then
    echo
    echo "Static release install prefix $STATIC_INSTALL_PREFIX does not exist"
    exit 1
  fi

  sh_c="sh_c"
  if [ ! -w "$STATIC_INSTALL_PREFIX" ]; then
    sh_c="sudo_sh_c"
  fi

  "$sh_c" tar -C "$STATIC_INSTALL_PREFIX" -xzf "$CACHE_DIR/code-server-$VERSION-$OS-$ARCH.tar.gz"
  # In case previously installed.
  SKIP_LOG=1 "$sh_c" rm -Rf "$STATIC_INSTALL_PREFIX/code-server-$VERSION"
  "$sh_c" mv -f "$STATIC_INSTALL_PREFIX/code-server-$VERSION-$OS-$ARCH" "$STATIC_INSTALL_PREFIX/code-server-$VERSION"

  echo_static_postinstall
}

install_npm() {
  echo "No precompiled releases for $(uname -m)."
  if command_exists yarn; then
    echo "Installing with yarn."
    sh_c yarn global add code-server --unsafe-perm
    return
  elif command_exists npm; then
    echo "Installing with npm."
    sh_c npm install -g code-server --unsafe-perm
    return
  fi
  echo
  echo "Please install npm or yarn to install code-server!"
  echo "You will need at least node v12 and a few C build dependencies."
  echo "See the docs https://github.com/cdr/code-server#yarn-npm"
  exit 1
}

os() {
  case "$(uname)" in
  Linux)
    echo linux
    ;;
  Darwin)
    echo macos
    ;;
  esac
}

# distro prints the detected operating system including linux distros.
#
# Example outputs:
# - macos
# - debian, ubuntu, raspbian
# - centos, fedora, rhel, opensuse
# - alpine
# - arch
#
# Inspired by https://github.com/docker/docker-install/blob/26ff363bcf3b3f5a00498ac43694bf1c7d9ce16c/install.sh#L111-L120.
distro() {
  if [ "$(uname)" = "Darwin" ]; then
    echo "macos"
    return
  fi

  if [ ! -f /etc/os-release ]; then
    return
  fi

  (
    . /etc/os-release
    case "$ID" in opensuse-*)
      # opensuse's ID's look like opensuse-leap and opensuse-tumbleweed.
      echo "opensuse"
      return
      ;;
    esac

    echo "$ID"
  )
}

# os_name prints a pretty human readable name for the OS/Distro.
distro_name() {
  if [ "$(uname)" = "Darwin" ]; then
    echo "macOS v$(sw_vers -productVersion)"
    return
  fi

  if [ ! -f /etc/os-release ]; then
    (
      . /etc/os-release
      echo "$PRETTY_NAME"
    )
  fi

  # Prints something like: Linux 4.19.0-9-amd64
  uname -sr
}

arch() {
  case "$(uname -m)" in
  aarch64)
    echo arm64
    ;;
  x86_64)
    echo amd64
    ;;
  esac
}

command_exists() {
  command -v "$@" > /dev/null 2>&1
}

sh_c() {
  if [ ! "${SKIP_LOG-}" ]; then
    echo
    echo "+ $*"
  fi
  if [ ! "${DRY_RUN-}" ]; then
    sh -c "$*"
  fi
}

sudo_sh_c() {
  if [ "$(id -u)" = 0 ]; then
    sh_c "$@"
  elif command_exists sudo; then
    sh_c "sudo $*"
  elif command_exists su; then
    sh_c "su -c '$*'"
  else
    echo
    echo "This script needs to run the following command as root."
    echo "  $*"
    echo "Please run this script as root or install sudo or su."
    exit 1
  fi
}

cache_dir() {
  if [ "${XDG_CACHE_HOME-}" ]; then
    echo "$XDG_CACHE_HOME/code-server"
  elif [ "${HOME-}" ]; then
    echo "$HOME/.cache/code-server"
  else
    echo "/tmp/code-server-cache"
  fi
}

main "$@"
