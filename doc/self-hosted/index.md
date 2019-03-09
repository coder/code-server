# Getting Started

[code-server](https://coder.com) is used by developers at Azure, Google, Reddit, and more to give them access to VS Code in the browser.

## Quickstart guide

> NOTE: If you get stuck or need help, [file an issue](https://github.com/codercom/code-server/issues/new?&title=Improve+self-hosted+quickstart+guide), [tweet (@coderhq)](https://twitter.com/coderhq) or [email](mailto:support@coder.com?subject=Self-hosted%20quickstart%20guide).

This document pertains to Coder specific implementations of VS Code. For documentation on how to use VS Code itself, please refer to the official [documentation for VS Code](https://code.visualstudio.com/docs) 

It takes just a few minutes to get your own self-hosted server running. If you've got a machine running macOS, Windows, or Linux, you're ready to start the binary which listens on port `8443` by default.

<!--
  DO NOT CHANGE THIS TO A CODEBLOCK.
  We want line breaks for readability, but backslashes to escape them do not work cross-platform.
  This uses line breaks that are rendered but not copy-pasted to the clipboard.
-->


1. Visit [the releases](https://github.com/codercom/code-server/releases) page and download the latest cli for your operating system
2. Double click the executable to run in the current directory
3. Copy the password that appears in the cli<img src="../assets/cli.png">
4. In your browser navigate to `localhost:8443`
5. Paste the password from the cli into the login window<img src="../assets/server-password-modal.png">
> NOTE: Be careful with your password as sharing it will grant those users access to your server's file system

### Things to know
- When you visit the IP for your code-server, you will be greeted   with this page. Code-server is using a self-signed SSL certificate for easy setup. To proceed to the IDE, click **"Advanced"**<img src ="../assets/chrome_warning.png">
- Then click **"proceed anyway"**<img src="../assets/chrome_confirm.png">

## Usage
<pre class="pre-wrap"><code>code-server<span class="virtual-br"></span> --help</code></pre>

code-server can be ran with a number of arguments to customize your working directory, host, port, and SSL certificate.

```
USAGE
  $ code-server [WORKDIR]

ARGUMENTS
  WORKDIR  [default: (directory to binary)] Specify working dir

OPTIONS
  -d, --data-dir=data-dir
  -h, --host=host          [default: 0.0.0.0]
  -o, --open               Open in browser on startup
  -p, --port=port          [default: 8443] Port to bind on
  -v, --version            show CLI version
  --allow-http
  --cert=cert
  --cert-key=cert-key
  --help                   show CLI help
  --no-auth
  --password=password
  ```

  ### Data directory
  Use `code-server -d (path/to/directory)` or `code-server --data-dir=(path/to/directory)`, excluding the parentheses to specify the root folder that VS Code will start in

  ### Host
  By default, code-server will use `0.0.0.0` as its address. This can be changed by using `code-server -h` or `code-server --host=` followed by the address you want to use. 
  > Example: `code-server -h 127.0.0.1`

  ### Open
  You can have the server automatically open the VS Code in your browser on startup by using the `code server -o` or `code-server --open` flags

  ### Port  
  By default, code-server will use `8443` as its port. This can be changed by using `code-server -p` or `code-server --port=` followed by the port you want to use. 
  > Example: `code-server -p 9000`

  ### Cert and Cert Key
  To encrypt the traffic between the browser and server use `code-server --cert=` followed by the path to your `.cer` file. Additionally, you can use certificate keys with `code-server --cert-key` followed by the path to your `.key` file.
> Example (certificate and key): `code-server --cert /etc/letsencrypt/live/example.com/fullchain.cer --cert-key /etc/letsencrypt/live/example.com/fullchain.key`

> To ensure the connection between you and your server is encrypted view our guide on [securing your setup](../security/ssl.md)

  ### Nginx Reverse Proxy
  Nginx is for reverse proxy. Here is a example virtual host that works with code-server. Please also pass --allow-http. You can also use certbot by EFF to get a ssl certificates for free.
  ```
  server {
    listen 80;
    listen [::]:80;
    server_name code.example.com code.example.org;
      location / {
         proxy_pass http://localhost:8443/;
         proxy_set_header Upgrade $http_upgrade;
         proxy_set_header Connection upgrade;
      }
   }
  ```

  ### Help
  Use `code-server -h` or `code-server --help` to view the usage for the cli. This is also shown at the beginning of this section.
