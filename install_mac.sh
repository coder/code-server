#!/usr/bin/env bash

bin_path=/usr/local/bin
lib_path=/usr/local/lib

version=2.1698
package=code-server2.1698-vsc1.41.1-darwin-x86_64

temp_path=/tmp/code-server-$version

set -e

rm -rf -f $temp_path
mkdir $temp_path
cd /tmp/code-server-$version

echo "-- Installing code-server version $version"
wget https://github.com/cdr/code-server/releases/download/$version/$package.zip > /dev/null

echo "-- Unpacking release"
unzip $package.zip > /dev/null
rm $package.zip

echo "-- Installing binary"
rm -rf -f $lib_path/code-server
mkdir $lib_path/code-server
mv -f ./$package/* $lib_path/code-server/

rm -f $bin_path/code-server
ln -s $lib_path/code-server/code-server $bin_path/code-server

rm -rf -f $temp_path

echo "-- Successfully installed code-server at $bin_path/code-server"
exit 0