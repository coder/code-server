# Docker launch commands for coder

## default coder uid:guid
docker run -it -p 127.0.0.1:8443:8443 \
 -v "${PWD}/code-server:/home/coder/project" \
 satlus-code-server:latest --allow-http --no-auth

 ## passing `id(-g|-u)` through the system
docker run -it -p 127.0.0.1:8443:8443 \
-v "${PWD}/code-server:/home/coder/project" \
-v "${PWD}/code-server/.cache:/home/coder/.cache" \
-v "${PWD}/code-server/.local:/home/coder/.local" \
-u $(id -u):$(id -g) \
satlus-code-server:latest --allow-http --no-auth