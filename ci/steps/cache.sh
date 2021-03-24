#!/usr/bin/env bash

# check for yarn cache
ls -l ~/.cache/yarn
# check size
echo "$(find ~/.cache/yarn/v6 -maxdepth 1 | wc -l) packages in cache"

# check for other items in cache
ls -l ~/.cache
