#!/usr/bin/env bash
# install_helper allows for easy installation of code-server on Linux systems
# the latest official release is pulled from the Github API, where the proper asset
# is then unpackaged and installed into ~/.local/share/code-server/<version>

# The code-server binary is linked to ~/.local/share/code-server/bin/code-server

set -euo pipefail

RED=1

get_releases() {
  curl --silent "https://api.github.com/repos/cdr/code-server/releases/latest" |
    grep '"browser_download_url":\|"tag_name":'
}

linux_install() {
  releases=$(get_releases)
  package=$(echo "$releases" | grep 'linux' | grep 'x86' | sed -E 's/.*"([^"]+)".*/\1/')
  version=$(echo $releases | sed -E 's/.*"tag_name": "([^"]+)".*/\1/')

  bin_dir=$HOME/.local/share/code-server/bin
  bin_path=$bin_dir/code-server
  lib_path=$HOME/.local/share/code-server/$version

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
    tput setaf $RED
    echo "-- ERROR: v$version already found in $lib_path"
    echo "-- ERROR: To reinstall, first delete this directory"
    tput sgr 0
    rm -rf -f $temp_path
    exit 1
  fi

  mkdir -p $lib_path

  mv -f code-server*/* $lib_path/

  mkdir -p $bin_dir
  ln -f -s $lib_path/code-server $bin_path

  code_server_bin=$(which code-server || true)
  if [ "$code_server_bin" == "" ]; then
    tput setaf $RED
    echo "-- WARNING: $bin_dir is not in your \$PATH"
    tput sgr 0
  fi

  rm -rf -f $temp_path
  echo "-- Successfully installed code-server at $bin_path"
}

if [[ $OSTYPE == "linux-gnu" ]]; then
  linux_install
else
  echo "Unknown operating system. Not installing."
  exit 1
fi
