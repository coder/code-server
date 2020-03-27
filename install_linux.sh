#!/usr/bin/env bash
bin_path=$HOME/bin
lib_path=$HOME/lib

version=2.1698
package=code-server2.1698-vsc1.41.1-linux-x86_64.tar.gz

temp_path=/tmp/code-server-$version

set -e

rm -rf -f $temp_path
mkdir $temp_path
cd $temp_path

echo "-- Installing code-server version $version"
wget https://github.com/cdr/code-server/releases/download/$version/$package > /dev/null

echo "-- Unpacking code-server release"
tar -xzf code-server*.tar.gz > /dev/null
rm -f code-server*.tar.gz

rm -rf -f $lib_path/code-server
mkdir -p $lib_path/code-server
mv -f code-server*/* $lib_path/code-server/

mkdir -p $bin_path
rm -f $bin_path/code-server
ln -f -s $lib_path/code-server/code-server $bin_path/code-server

rm -rf -f $temp_path
echo "-- Successfully installed code-server at $bin_path/code-server"
exit 0