#!/bin/bash
set -e

npm install -g cross-env
yarn task build:server:binary
