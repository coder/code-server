#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
NC='\033[0m' # No Color

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
    echo -e "${RED}-- ERROR: v$version already found in $lib_path${NC}"
    echo -e "${RED}-- ERROR: To reinstall, first delete this directory${NC}"
    rm -rf -f $temp_path
    exit 1
  fi

  mkdir -p $lib_path

  mv -f code-server*/* $lib_path/

  mkdir -p $bin_dir
  ln -f -s $lib_path/code-server $bin_path

  rm -rf -f $temp_path

  if [ $bin_dir != *"$PATH"* ]; then
    echo -e "${RED}-- WARNING: $bin_dir is not in your \$PATH${NC}"
  fi

  echo "-- Successfully installed code-server at $bin_path"
}

mac_install() {
  bin_path=/usr/local/bin
  lib_path=/usr/local/lib

  releases=$(get_releases)
  package=$(echo "$releases" | grep 'darwin' | sed -E 's/.*"([^"]+)".*/\1/')
  version=$(echo $releases | sed -E 's/.*"tag_name": "([^"]+)".*/\1/')

  temp_path=/tmp/code-server-$version

  if [ -d $temp_path ]; then
    rm -rf $temp_path
  fi

  mkdir $temp_path
  cd $temp_path

  echo "-- Downloading code-server v$version"
  wget $package > /dev/null

  echo "-- Unpacking release"
  unzip code-server-* > /dev/null
  rm code-server-*.zip

  echo "-- Installing binary"
  if [ -d $lib_path/code-server ]; then
    backup=$lib_path/BACKUP_$(date +%s)_code-server/
    mv $lib_path/code-server/ $backup
    echo "-- INFO: moved old code-server lib directory to $backup"
  fi
  mkdir -p $lib_path/code-server
  mv ./code-server-*/* $lib_path/code-server/

  rm -f $bin_path/code-server
  ln -s $lib_path/code-server/code-server $bin_path/code-server

  rm -rf -f $temp_path

  echo "-- Successfully installed code-server at $bin_path/code-server"
}

if [[ $OSTYPE == "linux-gnu" ]]; then
  linux_install
elif [[ $OSTYPE == "darwin"* ]]; then
  mac_install
else
  echo "Unknown operating system. Not installing."
  exit 1
fi
