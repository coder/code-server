#!/bin/bash

export HOME=/home/coder

if [[ -z $FIXUID ]];
 then 
    echo "fixuid flag not set..."
 else 
    echo "fixuid is set..."
    if [[ -z $FIXUID_QUIET ]];
      then
         fixuid
      else
         fixuid -q
   fi
fi

echo "starting coder..."
exec "$@"