#!/bin/bash

set -e

if [[ "$TRAVIS_OS_NAME" == "osx" ]]; then
	# If the Travis CI environment is MacOS, run the Jest tests
	# manually, since Docker is not supported.
	yarn test:jest
	exit 0
fi

imageID=`docker images -q code-server-e2e`

# Build the image, if it doesn't exist. Forcefully run, if the
# `--rebuild` flag is provided. Alternatively, the image can be
# rebuilt by manually running `yarn build:docker`.
if [[ "$imageID" == "" ]] || [[ "$1" == "--rebuild" ]]; then
	yarn build:docker
fi
yarn test:docker