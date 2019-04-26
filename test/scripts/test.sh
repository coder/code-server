#!/bin/bash

set -e

if [[ ! -d "./tmp" ]]; then
	mkdir -p ./tmp
fi

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
	if [[ "$TRAVIS_OS_NAME" != "" ]]; then
		vars=$(env | grep TRAVIS | awk -F'=' '{ printf "export %s=\"%s\"\n", $1, $2 }' | base64 --wrap=0)
		yarn build:docker --build-arg env_vars="$vars"
	else
		yarn build:docker
	fi
fi
yarn test:docker