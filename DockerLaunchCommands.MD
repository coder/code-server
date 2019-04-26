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
-e CODER_UID=$(id -u) \
-e CODER_GID=$(id -g) \
satlus-code-server:latest --allow-http --no-auth

### Error
found CODER_UID and CODER_GID env vars, running usermod...
sudo: unknown uid 501: who are you?
usermod: Permission denied.
usermod: cannot lock /etc/passwd; try again later.
sudo: unknown uid 501: who are you?

## the `usermod -g|-u` approach, by passing env var
docker run -it -p 127.0.0.1:8443:8443 \
-v "${PWD}/code-server:/home/coder/project" \
-v "${PWD}/code-server/.cache:/home/coder/.cache" \
-v "${PWD}/code-server/.local:/home/coder/.local" \
-e CODER_UID=$(id -u) \
-e CODER_GID=$(id -g) \
satlus-code-server:latest --allow-http --no-auth