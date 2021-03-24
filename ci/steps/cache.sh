#!/usr/bin/env bash

# check for yarn cache
ls -l ~/.cache/yarn
# check size
echo "$(ls -l ~/.cache/yarn/v6 | wc -l) packages in cache"
