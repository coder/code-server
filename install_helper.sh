#!/usr/bin/env bash
# install_helper allows for easy installation of code-server on Linux systems
# the latest official release is pulled from the Github API, where the proper asset
# is then unpackaged and installed into ~/.local/share/code-server/<version>

# The code-server binary is linked to ~/.local/share/code-server/bin/code-server

set -eo pipefail

get_releases() {
  curl --silent "https://api.github.com/repos/cdr/code-server/releases/latest" |
    grep '"browser_download_url":\|"tag_name":'
}

RED='\033[0;31m'
NC='\033[0m' # No Color
CYAN='\033[0;36m'

bin_dir=$HOME/.code-server/bin
bin_path=$bin_dir/code-server
lib_path=$HOME/.code-server/$version

linux_install() {
  releases=$(get_releases)
  package=$(echo "$releases" | grep 'linux' | grep 'x86' | sed -E 's/.*"([^"]+)".*/\1/')
  version=$(echo $releases | sed -E 's/.*"tag_name": "([^"]+)".*/\1/')

  temp_path=/tmp/code-server-$version

  if [ -d $temp_path ]; then
    rm -rf $temp_path
  fi

  mkdir $temp_path
  cd $temp_path

  echo "-- Downloading code-server v$version"
  wget $package > /dev/null

  echo "-- Unpacking code-server release"
  tar -xzf code-server*.tar.gz > /dev/null
  rm code-server*.tar.gz

  if [ -d $lib_path ]; then
    echo -e "$RED-- ERROR: v$version already found in $lib_path"
    echo -e "-- ERROR: To reinstall, first delete this directory$NC"
    rm -rf -f $temp_path1
    exit 1
  fi

  mkdir -p $lib_path

  mv -f code-server*/* $lib_path/

  mkdir -p $bin_dir
  ln -f -s $lib_path/code-server $bin_path

  rm -rf -f $temp_path
  echo "-- Successfully installed code-server at $bin_path"
}

# @see https://yarnpkg.com/install.sh
detect_profile() {
  if [ -n "${PROFILE}" ] && [ -f "${PROFILE}" ]; then
    echo "${PROFILE}"
    return
  fi

  local DETECTED_PROFILE
  DETECTED_PROFILE=''
  local SHELLTYPE
  SHELLTYPE="$(basename "/$SHELL")"

  if [ "$SHELLTYPE" = "bash" ]; then
    if [ -f "$HOME/.bashrc" ]; then
      DETECTED_PROFILE="$HOME/.bashrc"
    elif [ -f "$HOME/.bash_profile" ]; then
      DETECTED_PROFILE="$HOME/.bash_profile"
    fi
  elif [ "$SHELLTYPE" = "zsh" ]; then
    DETECTED_PROFILE="$HOME/.zshrc"
  elif [ "$SHELLTYPE" = "fish" ]; then
    DETECTED_PROFILE="$HOME/.config/fish/config.fish"
  fi

  if [ -z "$DETECTED_PROFILE" ]; then
    if [ -f "$HOME/.profile" ]; then
      DETECTED_PROFILE="$HOME/.profile"
    elif [ -f "$HOME/.bashrc" ]; then
      DETECTED_PROFILE="$HOME/.bashrc"
    elif [ -f "$HOME/.bash_profile" ]; then
      DETECTED_PROFILE="$HOME/.bash_profile"
    elif [ -f "$HOME/.zshrc" ]; then
      DETECTED_PROFILE="$HOME/.zshrc"
    elif [ -f "$HOME/.config/fish/config.fish" ]; then
      DETECTED_PROFILE="$HOME/.config/fish/config.fish"
    fi
  fi

  if [ ! -z "$DETECTED_PROFILE" ]; then
    echo "$DETECTED_PROFILE"
  fi
}

add_to_path() {
  cd "$HOME"
  echo '-- Adding to $PATH...'
  DETECTED_PROFILE="$(detect_profile)"
  SOURCE_STR="\nexport PATH=\"\$HOME/.code-server/bin:\$PATH\"\n"

  if [ -z "${DETECTED_PROFILE}" ]; then
    echo -e "$RED-- Profile not found. Tried ${DETECTED_PROFILE} (as defined in \$PROFILE), ~/.bashrc, ~/.bash_profile, ~/.zshrc, and ~/.profile."
    echo "-- Create one of them and run this script again"
    echo "-- Create it (touch ${DETECTED_PROFILE}) and run this script again"
    echo "   OR"
    echo -e "-- Append the following line to the correct file yourself$NC"

    echo -e "$CYAN${SOURCE_STR}$NC"
  else
    if [[ $DETECTED_PROFILE == *"fish"* ]]; then
      command fish -c 'set -U fish_user_paths $fish_user_paths ~/.code-server/bin'
      echo "-- We've added ~/.code-server/bin to your fish_user_paths universal variable"
    else
      echo -e "$SOURCE_STR" >> "$DETECTED_PROFILE"
      echo "-- We've added the following to your $DETECTED_PROFILE"
    fi

    echo "-- If this isn't the profile of your current shell then please add the following to your correct profile:"

    echo -e "$CYAN $SOURCE_STR $NC"

    version=$($bin_path --version) || (
      echo -e "$RED-- code-server was installed, but doesn't seem to be working :($NC"
      exit 1
    )

    echo "-- Successfully installed code-server $version! Please open another terminal where the \`code-server\` command will now be available."
  fi
}

if [[ $OSTYPE == "linux-gnu" ]]; then
  linux_install
  add_to_path
else
  echo "Unknown operating system. Not installing."
  exit 1
fi
