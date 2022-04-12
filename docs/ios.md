# Using code-server on iOS with iSH

1. Install iSH from the [App Store](https://apps.apple.com/us/app/ish-shell/id1436902243)
2. Install `curl` and `nano` with `apk add curl nano`
3. Configure iSH to use an earlier version of NodeJS with `nano /etc/apk/repositories` and edit `v3.14` to `v3.12` on both repository links.
4. Install `nodejs` and `npm` with `apk add nodejs npm`
5. Install code-server with `curl -fsSL https://code-server.dev/install.sh | sh`
6. Run code-server with `code-server`
7. Access on localhost:8080 in your browser
