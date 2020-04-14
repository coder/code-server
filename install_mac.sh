#!/usr/bin/env bash
set -e

bin_path=/usr/local/bin
lib_path=/usr/local/lib

get_releases() {
  curl --silent "https://api.github.com/repos/cdr/code-server/releases/latest" |
    grep '"browser_download_url":\|"tag_name":'
}

releases=$(get_releases)
package=$(echo "$releases" | grep 'darwin' | sed -E 's/.*"([^"]+)".*/\1/')
version=$(echo $releases | sed -E 's/.*"tag_name": "([^"]+)".*/\1/')

echo $version
echo $package

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
