#!/bin/sh
set -eu

# code-server's automatic install script.
# See https://github.com/cdr/code-server/blob/master/doc/install.md

usage() {
  arg0="$0"
  if [ "$0" = sh ]; then
    arg0="curl -fsSL https://code-server.dev/install.sh | sh -s --"
  else
    curl_usage="The latest script is available at https://code-server.dev/install.sh
"
  fi

  cat << EOF
Installs code-server for Linux and macOS.
It tries to use the system package manager if possible.
After successful installation it explains how to start using code-server.
${curl_usage-}
Usage:

  $arg0 [--dry-run] [--version X.X.X] [--method detect] [--prefix ~/.local]

  --dry-run
      Echo the commands for the install process without running them.
  --version X.X.X
      Install a specific version instead of the latest.
  --method [detect | archive]
      Choose the installation method. Defaults to detect.
      - detect detects the system package manager and tries to use it.
        Full reference on the process is further below.
      - archive installs a static release archive into ~/.local
        Add ~/.local/bin to your \$PATH to use it.
  --prefix <dir>
      Sets the prefix used by static release archives. Defaults to ~/.local
      The release is unarchived into ~/.local/lib/code-server-X.X.X
      and the binary symlinked into ~/.local/bin/code-server
      To install system wide pass ---prefix=/usr/local

- For Debian, Ubuntu and Raspbian it will install the latest deb package.
- For Fedora, CentOS, RHEL and openSUSE it will install the latest rpm package.
- For Arch Linux it will install the AUR package.
- For any unrecognized Linux operating system it will install the latest static
  release into ~/.local

- For macOS it will install the Homebrew package.
  - If Homebrew is not installed it will install the latest static release
    into ~/.local

- If ran on an architecture with no binary releases, it will install the
  npm package with yarn or npm.
  - We only have binary releases for amd64 and arm64 presently.

It will cache all downloaded assets into ~/.cache/code-server

More installation docs are at https://github.com/cdr/code-server/blob/master/doc/install.md
EOF
}

echo_latest_version() {
  # https://gist.github.com/lukechilds/a83e1d7127b78fef38c2914c4ececc3c#gistcomment-2758860
  version="$(curl -fsSLI -o /dev/null -w "%{url_effective}" https://github.com/cdr/code-server/releases/latest)"
  version="${version#https://github.com/cdr/code-server/releases/tag/v}"
  echo "$version"
}

echo_static_postinstall() {
  echo
  cat << EOF
Static release has been installed into $ARCHIVE_INSTALL_PREFIX/lib/code-server-$VERSION
Please extend your path to use code-server:
  PATH="$ARCHIVE_INSTALL_PREFIX/bin:\$PATH"
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
  if [ "${TRACE-}" ]; then
    set -x
  fi

  unset \
    DRY_RUN \
    METHOD \
    ARCHIVE_INSTALL_PREFIX \
    SKIP_ECHO \
    VERSION \
    OPTIONAL

  while [ "$#" -gt 0 ]; do
    case "$1" in
    --dry-run)
      DRY_RUN=1
      ;;
    --method)
      METHOD="$(parse_arg "$@")"
      shift
      ;;
    --method=*)
      METHOD="$(parse_arg "$@")"
      ;;
    --prefix)
      ARCHIVE_INSTALL_PREFIX="$(parse_arg "$@")"
      shift
      ;;
    --prefix=*)
      ARCHIVE_INSTALL_PREFIX="$(parse_arg "$@")"
      ;;
    --version)
      VERSION="$(parse_arg "$@")"
      shift
      ;;
    --version=*)
      VERSION="$(parse_arg "$@")"
      ;;
    -h | --h | -help | --help)
      usage
      exit 0
      ;;
    *)
      echoerr "Unknown flag $1"
      echoerr "Run with --help to see usage."
      exit 1
      ;;
    esac

    shift
  done

  VERSION="${VERSION-$(echo_latest_version)}"
  METHOD="${METHOD-detect}"
  if [ "$METHOD" != detect ] && [ "$METHOD" != archive ]; then
    echoerr "Unknown install method \"$METHOD\""
    echoerr "Run with --help to see usage."
    exit 1
  fi
  ARCHIVE_INSTALL_PREFIX="${ARCHIVE_INSTALL_PREFIX-$HOME/.local}"

  OS="$(os)"
  if [ ! "$OS" ]; then
    echoerr "Unsupported OS $(uname)."
    exit 1
  fi

  distro_name

  ARCH="$(arch)"
  if [ ! "$ARCH" ]; then
    if [ "$METHOD" = archive ]; then
      echoerr "No static releases available for the architecture $(uname -m)."
      echoerr 'Please rerun without the "--method archive" flag to install from npm.'
      exit 1
    fi
    echo "No precompiled releases for $(uname -m)."
    install_npm
    return
  fi

  CACHE_DIR="$(echo_cache_dir)"
  mkdir -p "$CACHE_DIR"

  if [ "$METHOD" = archive ]; then
    install_archive
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
    install_aur
    ;;
  *)
    echo "Unsupported package manager."
    install_archive
    ;;
  esac
}

parse_arg() {
  case "$1" in
  *=*)
    opt="${1#=*}"
    optarg="${1#*=}"
    if [ ! "$optarg" ] && [ ! "${OPTIONAL-}" ]; then
      echoerr "$opt requires an argument"
      echoerr "Run with --help to see usage."
      exit 1
    fi
    echo "$optarg"
    return
    ;;
  esac

  case "${2-}" in
  "" | -*)
    if [ ! "${OPTIONAL-}" ]; then
      echoerr "$1 requires an argument"
      echoerr "Run with --help to see usage."
      exit 1
    fi
    ;;
  *)
    echo "$2"
    return
    ;;
  esac
}

fetch() {
  URL="$1"
  FILE="$2"

  echo "+ Downloading $URL"

  if [ -e "$FILE" ]; then
    echo "+ Using cached $FILE"
    return
  fi

  SKIP_ECHO=1
  sh_c curl \
    -#fL \
    -o "$FILE.incomplete" \
    -C - \
    "$URL"
  sh_c mv "$FILE.incomplete" "$FILE"
  unset SKIP_ECHO

  echo "+ Downloaded into $FILE"
}

install_macos() {
  if command_exists brew; then
    echo "Installing from Homebrew."
    echo

    sh_c brew install code-server

    return
  fi

  echo "Homebrew not installed."

  install_archive
}

install_deb() {
  echo "Installing v$VERSION deb package from GitHub releases."
  echo

  fetch "https://github.com/cdr/code-server/releases/download/v$VERSION/code-server_${VERSION}_$ARCH.deb" "$CACHE_DIR/code-server_${VERSION}_$ARCH.deb"
  sudo_sh_c dpkg -i "$CACHE_DIR/code-server_${VERSION}_$ARCH.deb"

  echo_systemd_postinstall
}

install_rpm() {
  echo "Installing v$VERSION rpm package from GitHub releases."
  echo

  fetch "https://github.com/cdr/code-server/releases/download/v$VERSION/code-server-$VERSION-$ARCH.rpm" "$CACHE_DIR/code-server-$VERSION-$ARCH.rpm"
  sudo_sh_c rpm -i "$CACHE_DIR/code-server-$VERSION-$ARCH.rpm"

  echo_systemd_postinstall
}

install_aur() {
  echo "Installing from the AUR."
  echo

  prev_dir="$PWD"
  tmp_dir="$(mktemp -d)"
  cd "$tmp_dir"

  echo "+ Downloading PKGBUILD from https://aur.archlinux.org/cgit/aur.git/snapshot/code-server.tar.gz"
  SKIP_ECHO=1 sh_c 'curl -fsSL https://aur.archlinux.org/cgit/aur.git/snapshot/code-server.tar.gz | tar -xz --strip-components 1'
  unset SKIP_ECHO
  echo "+ Downloaded into $tmp_dir"
  sh_c makepkg -si

  cd "$prev_dir"
  rm -Rf "$tmp_dir"

  echo_systemd_postinstall
}

install_archive() {
  echo "Installing static release v$VERSION"
  echo

  fetch "https://github.com/cdr/code-server/releases/download/v$VERSION/code-server-$VERSION-$OS-$ARCH.tar.gz" \
    "$CACHE_DIR/code-server-$VERSION-$OS-$ARCH.tar.gz"

  sh_c="sh_c"
  if [ ! -w "$ARCHIVE_INSTALL_PREFIX" ]; then
    sh_c="sudo_sh_c"
  fi

  SKIP_ECHO=1 sh_c mkdir -p "$ARCHIVE_INSTALL_PREFIX/lib" "$ARCHIVE_INSTALL_PREFIX/bin"
  unset SKIP_ECHO

  if [ -e "$ARCHIVE_INSTALL_PREFIX/lib/code-server-$VERSION" ]; then
    echo
    echo "code-server-$VERSION is already installed at $ARCHIVE_INSTALL_PREFIX/lib/code-server-$VERSION"
    echo "Remove it to reinstall."
    exit 0
  fi
  "$sh_c" tar -C "$ARCHIVE_INSTALL_PREFIX/lib" -xzf "$CACHE_DIR/code-server-$VERSION-$OS-$ARCH.tar.gz"
  "$sh_c" mv -f "$ARCHIVE_INSTALL_PREFIX/lib/code-server-$VERSION-$OS-$ARCH" "$ARCHIVE_INSTALL_PREFIX/lib/code-server-$VERSION"
  "$sh_c" ln -fs "$ARCHIVE_INSTALL_PREFIX/lib/code-server-$VERSION/bin/code-server" "$ARCHIVE_INSTALL_PREFIX/bin/code-server"

  echo_static_postinstall
}

install_npm() {
  if command_exists yarn; then
    echo "Installing with yarn."
    echo
    sh_c yarn global add code-server --unsafe-perm
    return
  elif command_exists npm; then
    echo "Installing with npm."
    echo
    sh_c npm install -g code-server --unsafe-perm
    return
  fi
  echo
  echoerr "Please install npm or yarn to install code-server!"
  echoerr "You will need at least node v12 and a few C dependencies."
  echoerr "See the docs https://github.com/cdr/code-server#yarn-npm"
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

  if [ -f /etc/os-release ]; then
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
    return
  fi
}

# os_name prints a pretty human readable name for the OS/Distro.
distro_name() {
  if [ "$(uname)" = "Darwin" ]; then
    echo "macOS v$(sw_vers -productVersion)"
    return
  fi

  if [ -f /etc/os-release ]; then
    (
      . /etc/os-release
      echo "$PRETTY_NAME"
    )
    return
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
  if [ ! "${SKIP_ECHO-}" ]; then
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
    echoerr "This script needs to run the following command as root."
    echoerr "  $*"
    echoerr "Please install sudo or su."
    exit 1
  fi
}

echo_cache_dir() {
  if [ "${XDG_CACHE_HOME-}" ]; then
    echo "$XDG_CACHE_HOME/code-server"
  elif [ "${HOME-}" ]; then
    echo "$HOME/.cache/code-server"
  else
    echo "/tmp/code-server-cache"
  fi
}

echoerr() {
  echo "$@" >&2
}

main "$@"
