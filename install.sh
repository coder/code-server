#!/bin/sh
set -eu

# code-server's automatic install script.
# See https://github.com/cdr/code-server/blob/master/doc/install.md

usage() {
  arg0="$0"
  if [ "$0" = sh ]; then
    arg0="curl -fsSL https://code-server.dev/install.sh | sh -s --"
  else
    not_curl_usage="The latest script is available at https://code-server.dev/install.sh
"
  fi

  cath << EOF
Installs code-server for Linux, macOS and FreeBSD.
It tries to use the system package manager if possible.
After successful installation it explains how to start using code-server.

Pass in user@host to install code-server on user@host over ssh.
The remote host must have internet access.
${not_curl_usage-}
Usage:

  $arg0 [--dry-run] [--version X.X.X] [--method detect] \
        [--prefix ~/.local] [--rsh ssh] [user@host]

  --dry-run
      Echo the commands for the install process without running them.

  --version X.X.X
      Install a specific version instead of the latest.

  --method [detect | standalone]
      Choose the installation method. Defaults to detect.
      - detect detects the system package manager and tries to use it.
        Full reference on the process is further below.
      - standalone installs a standalone release archive into ~/.local
        Add ~/.local/bin to your \$PATH to use it.

  --prefix <dir>
      Sets the prefix used by standalone release archives. Defaults to ~/.local
      The release is unarchived into ~/.local/lib/code-server-X.X.X
      and the binary symlinked into ~/.local/bin/code-server
      To install system wide pass ---prefix=/usr/local

  --rsh <bin>
      Specifies the remote shell for remote installation. Defaults to ssh.

- For Debian, Ubuntu and Raspbian it will install the latest deb package.
- For Fedora, CentOS, RHEL and openSUSE it will install the latest rpm package.
- For Arch Linux it will install the AUR package.
- For any unrecognized Linux operating system it will install the latest standalone
  release into ~/.local

- For macOS it will install the Homebrew package.
  - If Homebrew is not installed it will install the latest standalone release
    into ~/.local

- For FreeBSD, it will install the npm package with yarn or npm.

- If ran on an architecture with no releases, it will install the
  npm package with yarn or npm.
  - We only have releases for amd64 and arm64 presently.
  - The npm package builds the native modules on postinstall.

It will cache all downloaded assets into ~/.cache/code-server

More installation docs are at https://github.com/cdr/code-server/blob/master/doc/install.md
EOF
}

echo_latest_version() {
  # https://gist.github.com/lukechilds/a83e1d7127b78fef38c2914c4ececc3c#gistcomment-2758860
  version="$(curl -fsSLI -o /dev/null -w "%{url_effective}" https://github.com/cdr/code-server/releases/latest)"
  version="${version#https://github.com/cdr/code-server/releases/tag/}"
  version="${version#v}"
  echo "$version"
}

echo_standalone_postinstall() {
  echoh
  cath << EOF
Standalone release has been installed into $STANDALONE_INSTALL_PREFIX/lib/code-server-$VERSION
Please extend your path to use code-server:
  PATH="$STANDALONE_INSTALL_PREFIX/bin:\$PATH"
Then you can run:
  code-server
EOF
}

echo_systemd_postinstall() {
  echoh
  cath << EOF
To have systemd start code-server now and restart on boot:
  sudo systemctl enable --now code-server@\$USER
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
    STANDALONE_INSTALL_PREFIX \
    VERSION \
    OPTIONAL \
    ALL_FLAGS \
    RSH_ARGS \
    RSH

  ALL_FLAGS=""
  while [ "$#" -gt 0 ]; do
    case "$1" in
    -*)
      ALL_FLAGS="${ALL_FLAGS} $1"
      ;;
    esac

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
      STANDALONE_INSTALL_PREFIX="$(parse_arg "$@")"
      shift
      ;;
    --prefix=*)
      STANDALONE_INSTALL_PREFIX="$(parse_arg "$@")"
      ;;
    --version)
      VERSION="$(parse_arg "$@")"
      shift
      ;;
    --version=*)
      VERSION="$(parse_arg "$@")"
      ;;
    --rsh)
      RSH="$(parse_arg "$@")"
      shift
      ;;
    --rsh=*)
      RSH="$(parse_arg "$@")"
      ;;
    -h | --h | -help | --help)
      usage
      exit 0
      ;;
    --)
      shift
      # We remove the -- added above.
      ALL_FLAGS="${ALL_FLAGS% --}"
      RSH_ARGS="$*"
      break
      ;;
    -*)
      echoerr "Unknown flag $1"
      echoerr "Run with --help to see usage."
      exit 1
      ;;
    *)
      RSH_ARGS="$*"
      break
      ;;
    esac

    shift
  done

  if [ "${RSH_ARGS-}" ]; then
    echoh "Installing remotely with $RSH $RSH_ARGS"
    curl -fsSL https://code-server.dev/install.sh | prefix "$RSH_ARGS" "$RSH" "$RSH_ARGS" sh -s -- "$ALL_FLAGS"
    return
  fi

  VERSION="${VERSION-$(echo_latest_version)}"
  METHOD="${METHOD-detect}"
  if [ "$METHOD" != detect ] && [ "$METHOD" != standalone ]; then
    echoerr "Unknown install method \"$METHOD\""
    echoerr "Run with --help to see usage."
    exit 1
  fi
  STANDALONE_INSTALL_PREFIX="${STANDALONE_INSTALL_PREFIX-$HOME/.local}"

  OS="$(os)"
  if [ ! "$OS" ]; then
    echoerr "Unsupported OS $(uname)."
    exit 1
  fi

  distro_name

  ARCH="$(arch)"
  if [ ! "$ARCH" ]; then
    if [ "$METHOD" = standalone ]; then
      echoerr "No precompiled releases for $(uname -m)."
      echoerr 'Please rerun without the "--method standalone" flag to install from npm.'
      exit 1
    fi
    echoh "No precompiled releases for $(uname -m)."
    install_npm
    return
  fi

  if [ "$OS" = "freebsd" ]; then
    if [ "$METHOD" = standalone ]; then
      echoerr "No precompiled releases available for $OS."
      echoerr 'Please rerun without the "--method standalone" flag to install from npm.'
      exit 1
    fi
    echoh "No precompiled releases available for $OS."
    install_npm
    return
  fi

  CACHE_DIR="$(echo_cache_dir)"

  if [ "$METHOD" = standalone ]; then
    install_standalone
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
    echoh "Unsupported package manager."
    install_standalone
    ;;
  esac
}

parse_arg() {
  case "$1" in
  *=*)
    # Remove everything after first equal sign.
    opt="${1%%=*}"
    # Remove everything before first equal sign.
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

  if [ -e "$FILE" ]; then
    echoh "+ Reusing $FILE"
    return
  fi

  sh_c mkdir -p "$CACHE_DIR"
  sh_c curl \
    -#fL \
    -o "$FILE.incomplete" \
    -C - \
    "$URL"
  sh_c mv "$FILE.incomplete" "$FILE"
}

install_macos() {
  if command_exists brew; then
    echoh "Installing from Homebrew."
    echoh

    sh_c brew install code-server

    return
  fi

  echoh "Homebrew not installed."

  install_standalone
}

install_deb() {
  echoh "Installing v$VERSION deb package from GitHub releases."
  echoh

  fetch "https://github.com/cdr/code-server/releases/download/v$VERSION/code-server_${VERSION}_$ARCH.deb" \
    "$CACHE_DIR/code-server_${VERSION}_$ARCH.deb"
  sudo_sh_c dpkg -i "$CACHE_DIR/code-server_${VERSION}_$ARCH.deb"

  echo_systemd_postinstall
}

install_rpm() {
  echoh "Installing v$VERSION rpm package from GitHub releases."
  echoh

  fetch "https://github.com/cdr/code-server/releases/download/v$VERSION/code-server-$VERSION-$ARCH.rpm" \
    "$CACHE_DIR/code-server-$VERSION-$ARCH.rpm"
  sudo_sh_c rpm -i "$CACHE_DIR/code-server-$VERSION-$ARCH.rpm"

  echo_systemd_postinstall
}

install_aur() {
  echoh "Installing from the AUR."
  echoh

  sh_c mkdir -p "$CACHE_DIR/code-server-aur"
  sh_c "curl -#fsSL https://aur.archlinux.org/cgit/aur.git/snapshot/code-server.tar.gz | tar -xzC $CACHE_DIR/code-server-aur --strip-components 1"
  echo "+ cd $CACHE_DIR/code-server-aur"
  if [ ! "${DRY_RUN-}" ]; then
    cd "$CACHE_DIR/code-server-aur"
  fi
  sh_c makepkg -si

  echo_systemd_postinstall
}

install_standalone() {
  echoh "Installing standalone release archive v$VERSION from GitHub releases."
  echoh

  fetch "https://github.com/cdr/code-server/releases/download/v$VERSION/code-server-$VERSION-$OS-$ARCH.tar.gz" \
    "$CACHE_DIR/code-server-$VERSION-$OS-$ARCH.tar.gz"

  sh_c="sh_c"
  if [ ! -w "$STANDALONE_INSTALL_PREFIX" ]; then
    sh_c="sudo_sh_c"
  fi

  if [ -e "$STANDALONE_INSTALL_PREFIX/lib/code-server-$VERSION" ]; then
    echoh
    echoh "code-server-$VERSION is already installed at $STANDALONE_INSTALL_PREFIX/lib/code-server-$VERSION"
    echoh "Remove it to reinstall."
    exit 0
  fi

  "$sh_c" mkdir -p "$STANDALONE_INSTALL_PREFIX/lib" "$STANDALONE_INSTALL_PREFIX/bin"
  "$sh_c" tar -C "$STANDALONE_INSTALL_PREFIX/lib" -xzf "$CACHE_DIR/code-server-$VERSION-$OS-$ARCH.tar.gz"
  "$sh_c" mv -f "$STANDALONE_INSTALL_PREFIX/lib/code-server-$VERSION-$OS-$ARCH" "$STANDALONE_INSTALL_PREFIX/lib/code-server-$VERSION"
  "$sh_c" ln -fs "$STANDALONE_INSTALL_PREFIX/lib/code-server-$VERSION/bin/code-server" "$STANDALONE_INSTALL_PREFIX/bin/code-server"

  echo_standalone_postinstall
}

install_npm() {
  if command_exists yarn; then
    sh_c="sh_c"
    if [ ! -w "$(yarn global bin)" ]; then
      sh_c="sudo_sh_c"
    fi
    echoh "Installing with yarn."
    echoh
    "$sh_c" yarn global add code-server --unsafe-perm
    return
  elif command_exists npm; then
    sh_c="sh_c"
    if [ ! -w "$(npm config get prefix)" ]; then
      sh_c="sudo_sh_c"
    fi
    echoh "Installing with npm."
    echoh
    "$sh_c" npm install -g code-server --unsafe-perm
    return
  fi
  echoh
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
  FreeBSD)
    echo freebsd
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
# - freebsd
#
# Inspired by https://github.com/docker/docker-install/blob/26ff363bcf3b3f5a00498ac43694bf1c7d9ce16c/install.sh#L111-L120.
distro() {
  if [ "$OS" = "macos" ] || [ "$OS" = "freebsd" ]; then
    echo "$OS"
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
  amd64) # FreeBSD.
    echo amd64
    ;;
  esac
}

command_exists() {
  command -v "$@" > /dev/null
}

sh_c() {
  echoh "+ $*"
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
    echoh
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

echoh() {
  echo "$@" | humanpath
}

cath() {
  humanpath
}

echoerr() {
  echoh "$@" >&2
}

# humanpath replaces all occurances of " $HOME" with " ~"
# and all occurances of '"$HOME' with the literal '"$HOME'.
humanpath() {
  sed "s# $HOME# ~#g; s#\"$HOME#\"\$HOME#g"
}

# We need to make sure we exit with a non zero exit if the command fails.
# /bin/sh does not support -o pipefail unfortunately.
prefix() {
  PREFIX="$1"
  shift
  fifo="$(mktemp -d)/fifo"
  mkfifo "$fifo"
  sed -e "s#^#$PREFIX: #" "$fifo" &
  "$@" > "$fifo" 2>&1
}

main "$@"
