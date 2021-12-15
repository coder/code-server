# Running code-server using UserLAnd

1. Install UserLAnd from [Google Play](https://play.google.com/store/apps/details?id=tech.ula&hl=en_US&gl=US)
2. Install an Ubuntu VM
3. Start app
4. Install Node.js, `curl` and `yarn` using `sudo apt install nodejs npm yarn curl -y`
5. Install `nvm`:

```shell
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

6. Exit the terminal using `exit` and then reopen the terminal
7. Install and use Node.js 14:

```shell
nvm install 14
nvm use 14
```

8. Install code-server globally on device with: `npm i -g code-server`
9. Run code-server with `code-server`
10. Access on localhost:8080 in your browser
