<!-- prettier-ignore-start -->
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# Setup Guide

- [Expose code-server](#expose-code-server)
  - [Port forwarding via SSH](#port-forwarding-via-ssh)
  - [Using Let's Encrypt with Caddy](#using-lets-encrypt-with-caddy)
  - [Using Let's Encrypt with NGINX](#using-lets-encrypt-with-nginx)
  - [Using a self-signed certificate](#using-a-self-signed-certificate)
  - [TLS 1.3 and Safari](#tls-13-and-safari)
- [External authentication](#external-authentication)
- [HTTPS and self-signed certificates](#https-and-self-signed-certificates)
- [Accessing web services](#accessing-web-services)
  - [Using a subdomain](#using-a-subdomain)
  - [Using a subpath](#using-a-subpath)
  - [Using your own proxy](#using-your-own-proxy)
  - [Stripping `/proxy/<port>` from the request path](#stripping-proxyport-from-the-request-path)
  - [Proxying to create a React app](#proxying-to-create-a-react-app)
  - [Proxying to a Vue app](#proxying-to-a-vue-app)
  - [Proxying to an Angular app](#proxying-to-an-angular-app)
  - [Proxying to a Svelte app](#proxying-to-a-svelte-app)
  - [Prefixing `/absproxy/<port>` with a path](#prefixing-absproxyport-with-a-path)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->
<!-- prettier-ignore-end -->

This article will walk you through exposing code-server securely once you've
completed the [installation process](install.md).

## Expose code-server

**Never** expose code-server directly to the internet without some form of
authentication and encryption, otherwise someone can take over your machine via
the terminal.

By default, code-server uses password authentication. As such, you must copy the
password from code-server's config file to log in. To avoid exposing itself
unnecessarily, code-server listens on `localhost`; this practice is fine for
testing, but it doesn't work if you want to access code-server from a different
machine.

> **Rate limits:** code-server rate limits password authentication attempts to
> two per minute plus an additional twelve per hour.

There are several approaches to operating and exposing code-server securely:

- Port forwarding via SSH
- Using Let's Encrypt with Caddy
- Using Let's Encrypt with NGINX
- Using a self-signed certificate

### Port forwarding via SSH

We highly recommend using [port forwarding via
SSH](https://help.ubuntu.com/community/SSH/OpenSSH/PortForwarding) to access
code-server. If you have an SSH server on your remote machine, this approach
doesn't require any additional setup at all.

The downside to SSH forwarding, however, is that you can't access code-server
when using machines without SSH clients (such as iPads). If this applies to you,
we recommend using another method, such as [Let's Encrypt](#let-encrypt) instead.

> To work properly, your environment should have WebSockets enabled, which
> code-server uses to communicate between the browser and server.

1. SSH into your instance and edit the code-server config file to disable
   password authentication:

   ```console
   # Replaces "auth: password" with "auth: none" in the code-server config.
   sed -i.bak 's/auth: password/auth: none/' ~/.config/code-server/config.yaml
   ```

2. Restart code-server:

   ```console
   sudo systemctl restart code-server@$USER
   ```

3. Forward local port `8080` to `127.0.0.1:8080` on the remote instance by running the following command on your local machine:

   ```console
   # -N disables executing a remote shell
   ssh -N -L 8080:127.0.0.1:8080 [user]@<instance-ip>
   ```

4. At this point, you can access code-server by pointing your web browser to `http://127.0.0.1:8080`.

5. If you'd like to make the port forwarding via SSH persistent, we recommend
   using [mutagen](https://mutagen.io/documentation/introduction/installation)
   to do so. Once you've installed mutagen, you can port forward as follows:

   ```shell
   # This is the same as the above SSH command, but it runs in the background
   # continuously. Be sure to add `mutagen daemon start` to your ~/.bashrc to
   # start the mutagen daemon when you open a shell.
   mutagen forward create --name=code-server tcp:127.0.0.1:8080 < instance-ip > :tcp:127.0.0.1:8080
   ```

6. Optional, but highly recommended: add the following to `~/.ssh/config` so
   that you can detect bricked SSH connections:

   ```bash
   Host *
   ServerAliveInterval 5
   ExitOnForwardFailure yes
   ```

> You can [forward your
> SSH](https://developer.github.com/v3/guides/using-ssh-agent-forwarding/) and
> [GPG agent](https://wiki.gnupg.org/AgentForwarding) to the instance to
> securely access GitHub and sign commits without having to copy your keys.

### Using Let's Encrypt with Caddy

Using [Let's Encrypt](https://letsencrypt.org) is an option if you want to
access code-server on an iPad or do not want to use SSH port forwarding.

1. This option requires that the remote machine be exposed to the internet. Make sure that your instance allows HTTP/HTTPS traffic.

1. You'll need a domain name (if you don't have one, you can purchase one from
   [Google Domains](https://domains.google.com) or the domain service of your
   choice)). Once you have a domain name, add an A record to your domain that contains your
   instance's IP address.

1. Install [Caddy](https://caddyserver.com/docs/download#debian-ubuntu-raspbian):

```console
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

1. Replace `/etc/caddy/Caddyfile` using `sudo` so that the file looks like this:

   ```text
   mydomain.com {
     reverse_proxy 127.0.0.1:8080
   }
   ```

   If you want to serve code-server from a sub-path, you can do so as follows:

   ```text
   mydomain.com/code/* {
     uri strip_prefix /code
     reverse_proxy 127.0.0.1:8080
   }
   ```

   Remember to replace `mydomain.com` with your domain name!

1. Reload Caddy:

   ```console
   sudo systemctl reload caddy
   ```

At this point, you should be able to access code-server via
`https://mydomain.com`.

### Using Let's Encrypt with NGINX

1. This option requires that the remote machine be exposed to the internet. Make sure that your instance allows HTTP/HTTPS traffic.

1. You'll need a domain name (if you don't have one, you can purchase one from
   [Google Domains](https://domains.google.com) or the domain service of your
   choice)). Once you have a domain name, add an A record to your domain that contains your
   instance's IP address.

1. Install NGINX:

   ```bash
   sudo apt update
   sudo apt install -y nginx certbot python3-certbot-nginx
   ```

1. Update `/etc/nginx/sites-available/code-server` using sudo with the following
   configuration:

   ```text
   server {
       listen 80;
       listen [::]:80;
       server_name mydomain.com;

       location / {
         proxy_pass http://localhost:8080/;
         proxy_set_header Host $http_host;
         proxy_set_header Upgrade $http_upgrade;
         proxy_set_header Connection upgrade;
         proxy_set_header Accept-Encoding gzip;
       }
   }
   ```

   Be sure to replace `mydomain.com` with your domain name!

1. Enable the config:

   ```console
   sudo ln -s ../sites-available/code-server /etc/nginx/sites-enabled/code-server
   sudo certbot --non-interactive --redirect --agree-tos --nginx -d mydomain.com -m me@example.com
   ```

   Be sure to replace `me@example.com` with your actual email.

At this point, you should be able to access code-server via
`https://mydomain.com`.

### Using a self-signed certificate

> Self signed certificates do not work with iPad; see [./ipad.md](./ipad.md) for
> more information.

Before proceeding, we recommend familiarizing yourself with the [risks of
self-signing a certificate for
SSL](https://security.stackexchange.com/questions/8110).

We recommend self-signed certificates as a last resort, since self-signed
certificates do not work with iPads and may cause unexpected issues with
code-server. You should only proceed with this option if:

- You do not want to buy a domain or you cannot expose the remote machine to
  the internet
- You do not want to use port forwarding via SSH

To use a self-signed certificate:

1. This option requires that the remote machine be exposed to the internet. Make
   sure that your instance allows HTTP/HTTPS traffic.

1. SSH into your instance and edit your code-server config file to use a
   randomly generated self-signed certificate:

   ```console
   # Replaces "cert: false" with "cert: true" in the code-server config.
   sed -i.bak 's/cert: false/cert: true/' ~/.config/code-server/config.yaml
   # Replaces "bind-addr: 127.0.0.1:8080" with "bind-addr: 0.0.0.0:443" in the code-server config.
   sed -i.bak 's/bind-addr: 127.0.0.1:8080/bind-addr: 0.0.0.0:443/' ~/.config/code-server/config.yaml
   # Allows code-server to listen on port 443.
   sudo setcap cap_net_bind_service=+ep /usr/lib/code-server/lib/node
   ```

1. Restart code-server:

   ```console
   sudo systemctl restart code-server@$USER
   ```

At this point, you should be able to access code-server via
`https://<your-instance-ip>`.

If you'd like to avoid the warnings displayed by code-server when using a
self-signed certificate, you can use [mkcert](https://mkcert.dev) to create a
self-signed certificate that's trusted by your operating system, then pass the
certificate to code-server via the `cert` and `cert-key` config fields.

### TLS 1.3 and Safari

If you will be using Safari and your configuration does not allow anything less
than TLS 1.3 you will need to add support for TLS 1.2 since Safari does not
support TLS 1.3 for web sockets at the time of writing. If this is the case you
should see OSSStatus: 9836 in the browser console.

## External authentication

If you want to use external authentication mechanism (e.g., Sign in with
Google), you can do this with a reverse proxy such as:

- [Pomerium](https://www.pomerium.io/guides/code-server.html)
- [oauth2_proxy](https://github.com/pusher/oauth2_proxy)
- [Cloudflare Access](https://teams.cloudflare.com/access)

## HTTPS and self-signed certificates

For HTTPS, you can use a self-signed certificate by:

- Passing in `--cert`
- Passing in an existing certificate by providing the path to `--cert` and the
  path to the key with `--cert-key`

The self signed certificate will be generated to
`~/.local/share/code-server/self-signed.crt`.

If you pass a certificate to code-server, it will respond to HTTPS requests and
redirect all HTTP requests to HTTPS.

> You can use [Let's Encrypt](https://letsencrypt.org/) to get a TLS certificate
> for free.

Note: if you set `proxy_set_header Host $host;` in your reverse proxy config, it will change the address displayed in the green section of code-server in the bottom left to show the correct address.

## Accessing web services

If you're working on web services and want to access them locally, code-server
can proxy to any port using either a subdomain or a subpath, allowing you to
securely access these services using code-server's built-in authentication.

### Using a subdomain

You will need a DNS entry that points to your server for each port you want to
access. You can either set up a wildcard DNS entry for `*.<domain>` if your
domain name registrar supports it, or you can create one for every port you want
to access (`3000.<domain>`, `8080.<domain>`, etc).

You should also set up TLS certificates for these subdomains, either using a
wildcard certificate for `*.<domain>` or individual certificates for each port.

To set your domain, start code-server with the `--proxy-domain` flag:

```console
code-server --proxy-domain <domain>
```

For instance, if you have code-server exposed on `domain.tld` and a Python
server running on port 8080 of the same machine code-server is running on, you
could run code-server with `--proxy-domain domain.tld` and access the Python
server via `8080.domain.tld`.

Note that this uses the host header, so ensure your reverse proxy (if you're
using one) forwards that information.

### Using a subpath

Simply browse to `/proxy/<port>/`. For instance, if you have code-server
exposed on `domain.tld` and a Python server running on port 8080 of the same
machine code-server is running on, you could access the Python server via
`domain.tld/proxy/8000`.

### Using your own proxy

You can make extensions and the ports panel use your own proxy by setting
`VSCODE_PROXY_URI`. For example if you set
`VSCODE_PROXY_URI=https://{{port}}.kyle.dev` when an application is detected
running on port 3000 of the same machine code-server is running on the ports
panel will create a link to https://3000.kyle.dev instead of pointing to the
built-in subpath-based proxy.

Note: relative paths are also supported i.e.
`VSCODE_PROXY_URI=./proxy/{{port}}`

### Stripping `/proxy/<port>` from the request path

You may notice that the code-server proxy strips `/proxy/<port>` from the
request path.

HTTP servers should use relative URLs to avoid the need to be coupled to the
absolute path at which they are served. This means you must [use trailing
slashes on all paths with
subpaths](https://blog.cdivilly.com/2019/02/28/uri-trailing-slashes).

This reasoning is why the default behavior is to strip `/proxy/<port>` from the
base path. If your application uses relative URLs and does not assume the
absolute path at which it is being served, it will just work no matter what port
you decide to serve it off or if you put it in behind code-server or any other
proxy.

However, some prefer the cleaner aesthetic of no trailing slashes. Omitting the
trailing slashes couples you to the base path, since you cannot use relative
redirects correctly anymore. If you're okay with this tradeoff, use `/absproxy`
instead and the path will be passed as is (e.g., `/absproxy/3000/my-app-path`).

### Proxying to create a React app

You must use `/absproxy/<port>` with `create-react-app` (see
[#2565](https://github.com/coder/code-server/issues/2565) and
[#2222](https://github.com/coder/code-server/issues/2222) for more information).
You will need to inform `create-react-app` of the path at which you are serving
via `$PUBLIC_URL` and webpack via `$WDS_SOCKET_PATH`:

```sh
PUBLIC_URL=/absproxy/3000 \
  WDS_SOCKET_PATH=$PUBLIC_URL/sockjs-node \
  BROWSER=none yarn start
```

You should then be able to visit `https://my-code-server-address.io/absproxy/3000` to see your app exposed through
code-server!

> We highly recommend using the subdomain approach instead to avoid this class of issue.

### Proxying to a Vue app

Similar to the situation with React apps, you have to make a few modifications to proxy a Vue app.

1. add `vue.config.js`
2. update the values to match this (you can use any free port):

```js
module.exports = {
  devServer: {
    port: 3454,
    sockPath: "sockjs-node",
  },
  publicPath: "/absproxy/3454",
}
```

3. access app at `<code-server-root>/absproxy/3454` e.g. `http://localhost:8080/absproxy/3454`

Read more about `publicPath` in the [Vue.js docs](https://cli.vuejs.org/config/#publicpath)

### Proxying to an Angular app

In order to use code-server's built-in proxy with Angular, you need to make the following changes in your app:

1. use `<base href="./.">` in `src/index.html`
2. add `--serve-path /absproxy/4200` to `ng serve` in your `package.json`

For additional context, see [this GitHub Discussion](https://github.com/coder/code-server/discussions/5439#discussioncomment-3371983).

### Proxying to a Svelte app

In order to use code-server's built-in proxy with Svelte, you need to make the following changes in your app:

1. Add `svelte.config.js` if you don't already have one
2. Update the values to match this (you can use any free port):

```js
const config = {
  kit: {
    paths: {
      base: "/absproxy/5173",
    },
  },
}
```

3. Access app at `<code-server-root>/absproxy/5173/` e.g. `http://localhost:8080/absproxy/5173/

For additional context, see [this Github Issue](https://github.com/sveltejs/kit/issues/2958)

### Prefixing `/absproxy/<port>` with a path

This is a case where you need to serve an application via `absproxy` as explained above while serving `codeserver` itself from a path other than the root in your domain.

For example: `http://my-code-server.com/user/123/workspace/my-app`. To achieve this result:

1. Start code server with the switch `--abs-proxy-base-path=/user/123/workspace`
2. Follow one of the instructions above for your framework.
