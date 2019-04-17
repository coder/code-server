#!/bin/bash
set -e

echo "$VERSION" "$TRAVIS_COMMIT"
git config --local user.name "$USER_NAME"
git config --local user.email "$USER_EMAIL"
git tag "$VERSION" "$TRAVIS_COMMIT"
yarn task package "$VERSION"