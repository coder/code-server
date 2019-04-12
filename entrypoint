#!/bin/sh

export HOME=/home/coder
export USER_ID=$(id -u)
export GROUP_ID=$(id -g)

sudo usermod -u $USER_ID coder && sudo groupmod -g $GROUP_ID coder

exec "$@"