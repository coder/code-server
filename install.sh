#!/bin/sh
set -eu

usage() {
  cli="$0"
  if [ "$0" = sh ]; then
    cli="curl -fsSL https://code-server.dev/install.sh | sh -s --"
  else
    curl_usage="$(
      cat << EOF

To use latest:

  curl -fsSL https://code-server.dev/install.sh | sh -s -- <args>
EOF
    )"$"\n"
  fi
  cat << EOF
Installs the latest code-server on Linux or macOS preferring to use the system package manager.

Lives at https://code-server.dev/install.sh

Usage:

  $cli [--dry-run] [--version X.X.X] [--static <install-prefix>=~/.local]
${curl_usage-}
- For Debian, Ubuntu, Raspbian it will install the latest deb package.
- For Fedora, CentOS, RHEL, openSUSE it will install the latest rpm package.
- For Arch Linux it will install the AUR package.
- For any unrecognized Linux operating system it will install the latest static release into ~/.local
  - Add ~/.local/bin to your \$PATH to run code-server.

- For macOS it will install the Homebrew package.
  - If Homebrew is not installed it will install the latest static release into ~/.local
  - Add ~/.local/bin to your \$PATH to run code-server.

- If ran on an architecture with no binary releases, it will install the npm package with yarn or npm.
  - We only have binary releases for amd64 and arm64 presently.

    --dry-run Enables a dry run where where the steps that would have taken place
              are printed but do not actually execute.

    --version Pass to install a specific version instead of the latest release.

    --static  Forces the installation of a static release into ~/.local

              This flag takes an optional argument for the installation prefix which defaults to "~/.local".
              code-server will be unarchived into ~/.local/lib/code-server.X.X.X and the binary will be symlinked
              into "~/.local/bin/code-server". You will need to add ~/.local/bin to your \$PATH to use it without
              the full path.

              To install system wide set the prefix to /usr/local.
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
Static release has been installed into $STATIC_INSTALL_PREFIX/lib/code-server-$VERSION
Please extend your path to use code-server:
  PATH="$STATIC_INSTALL_PREFIX/bin:\$PATH"
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
    STATIC \
    STATIC_INSTALL_PREFIX \
    SKIP_ECHO \
    VERSION \
    OPTIONAL

  while [ "$#" -gt 0 ]; do
    case "$1" in
    --dry-run)
      DRY_RUN=1
      ;;
    --static)
      STATIC=1
      if [ "${2-}" ]; then
        STATIC_INSTALL_PREFIX="$(OPTIONAL=1 parse_arg "$@")"
        shift
      fi
      ;;
    --static=*)
      STATIC=1
      STATIC_INSTALL_PREFIX="$(OPTIONAL=1 parse_arg "$@")"
      ;;
    --version)
      VERSION="$(parse_arg "$@")"
      shift
      ;;
    --version=*)
      VERSION="$(parse_arg "$@")"
      ;;
    -h | --h | --help)
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
  STATIC_INSTALL_PREFIX="${STATIC_INSTALL_PREFIX-$HOME/.local}"

  OS="$(os)"
  if [ ! "$OS" ]; then
    echoerr "Unsupported OS $(uname)."
    exit 1
  fi

  distro_name

  ARCH="$(arch)"
  if [ ! "$ARCH" ]; then
    if [ "${STATIC-}" ]; then
      echoerr "No static releases available for the architecture $(uname -m)."
      echoerr "Please rerun without the -s flag to install from npm."
      exit 1
    fi
    install_npm
    exit 0
  fi

  CACHE_DIR="$(echo_cache_dir)"
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
  SKIP_ECHO=1 sh_c mv "$FILE.incomplete" "$FILE"
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

install_aur() {
  echo "Installing from the AUR."

  fetch "https://aur.archlinux.org/cgit/aur.git/snapshot/code-server.tar.gz" "$CACHE_DIR/code-server-aur.tar.gz"

  tmp_dir="$(mktemp -d)"
  (
    cd "$tmp_dir"
    SKIP_ECHO=1 sh_c tar -xzf "$CACHE_DIR/code-server-aur.tar.gz" --strip-components 1
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
    echoerr "Static release install prefix $STATIC_INSTALL_PREFIX does not exist"
    exit 1
  fi

  sh_c="sh_c"
  if [ ! -w "$STATIC_INSTALL_PREFIX" ]; then
    sh_c="sudo_sh_c"
  fi
  SKIP_ECHO=1 sh_c mkdir -p "$STATIC_INSTALL_PREFIX/lib" "$STATIC_INSTALL_PREFIX/bin"

  if [ -e "$STATIC_INSTALL_PREFIX/lib/code-server-$VERSION" ]; then
    echo
    echoerr "code-server-$VERSION is already installed at $STATIC_INSTALL_PREFIX/lib/code-server-$VERSION"
    echoerr "Please remove it to reinstall."
    exit 1
  fi
  "$sh_c" tar -C "$STATIC_INSTALL_PREFIX/lib" -xzf "$CACHE_DIR/code-server-$VERSION-$OS-$ARCH.tar.gz"
  "$sh_c" mv -f "$STATIC_INSTALL_PREFIX/lib/code-server-$VERSION-$OS-$ARCH" "$STATIC_INSTALL_PREFIX/lib/code-server-$VERSION"

  echo_static_postinstall
}

install_npm() {
  echoerr "No precompiled releases for $(uname -m)."
  if command_exists yarn; then
    echo "Installing with yarn."
    sh_c yarn global add code-server --unsafe-perm
    return
  elif command_exists npm; then
    echo "Installing with npm."
    sh_c npm install -g code-server --unsafe-perm
    return
  fi
  echoerr
  echoerr "Please install npm or yarn to install code-server!"
  echoerr "You will need at least node v12 and a few C build dependencies."
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
    echoerr "This script needs to run the following command as root."
    echoerr "  $*"
    echoerr "Please run this script as root or install sudo or su."
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
