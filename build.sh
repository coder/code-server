#!/bin/bash

# Build a Golden Helix docker image for code-server with changes to support App Streaming on VSWarehouse

# Follow the directions under [CONTRIBUTING.md](docs/CONTRIBUTING.md) to build the image

# git submodule update --init
# quilt push -a
# npm install
# npm run build
# VERSION=4.96.2 npm run build:vscode
# npm run release

# VERSION=4.96.2 npm run package
# cd release
# npm install --omit=dev
# cd ..
# npm run release:standalone

export VERSION=4.96.2

export SERVER_VERSION=20241223_895aa2908981

# Ensure we're in the correct directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Temporarily move the bundled node out of the way
if [ -f "release-standalone/lib/node" ]; then
    mv release-standalone/lib/node ./node
fi

echo "PWD: $PWD"

docker build --no-cache \
  --build-arg SERVER_VERSION=${SERVER_VERSION} \
  -t registry.goldenhelix.com/gh/code-server:${VERSION} .

# Move the bundled node back
if [ -f "./node" ]; then
    mv ./node release-standalone/lib/node
fi

# Add "code" as symlink
cd release-standalone/lib/vscode/bin/remote-cli/
ln -s code-linux.sh code

# Run like
# docker run -it  -p 8081:8080 -e PASSWORD=your_secure_password123 -e PORT=8080  registry.goldenhelix.com/gh/code-server:20241223_895aa2908981 /home/ghuser/Workspace/
