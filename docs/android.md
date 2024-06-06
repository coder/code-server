# Running code-server using UserLAnd

1. Install UserLAnd from [Google Play](https://play.google.com/store/apps/details?id=tech.ula&hl=en_US&gl=US)
2. Install an Ubuntu VM
3. Start app
4. Install Node.js and `curl` using `sudo apt install nodejs npm curl -y`
5. Install `nvm`:

```shell
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

6. Exit the terminal using `exit` and then reopen the terminal
7. Install and use Node.js 20:

```shell
nvm install 18
nvm use 18
```

8. Install code-server globally on device with: `npm install --global code-server`
9. Run code-server with `code-server`
10. Access on localhost:8080 in your browser

# Running code-server using Nix-on-Droid

1. Install Nix-on-Droid from [F-Droid](https://f-droid.org/packages/com.termux.nix/)
2. Start app
3. Spawn a shell with code-server by running `nix-shell -p code-server`
4. Run code-server with `code-server`
5. Access on localhost:8080 in your browser
