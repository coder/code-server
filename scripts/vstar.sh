#!/bin/bash
set -euxo pipefail

# Builds a tarfile containing vscode sourcefiles neccessary for CI.
# Done outside the CI and uploaded to object storage to reduce CI time.

branch=1.33.1
dir=/tmp/vstar
outfile=/tmp/vstar-$branch.tar.gz
rm -rf $dir
mkdir -p $dir

cd $dir
git clone https://github.com/microsoft/vscode --branch $branch --single-branch --depth=1
cd vscode

yarn

npx gulp vscode-linux-x64 --max-old-space-size=32384
rm -rf extensions build out* test
cd ..
mv *-x64/resources/app/extensions ./extensions
rm -rf *-x64
tar -czvf $outfile .
