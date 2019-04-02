#!/bin/bash
set -e

yarn task build:server:binary
yarn task test:e2e