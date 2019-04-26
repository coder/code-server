#!/bin/bash

export HOME=/home/coder

if [[ -z $CODER_UID || -z $CODER_GID ]];
 then 
    echo "didn't find CODER_UID or CODER_GID env vars, running with container default uid:gid"
 else 
    echo "found CODER_UID and CODER_GID env vars, running usermod...";
    usermod -u $CODER_UID coder && sudo usermod -g $CODER_GID coder
fi

exec "$@"