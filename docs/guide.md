<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# Setup Guide

- [1. Acquire a remote machine](#1-acquire-a-remote-machine)
  - [Requirements](#requirements)
  - [Google Cloud](#google-cloud)
- [2. Install code-server](#2-install-code-server)
- [3. Expose code-server](#3-expose-code-server)
  - [SSH forwarding](#ssh-forwarding)
  - [Let's Encrypt](#lets-encrypt)
    - [NGINX](#nginx)
  - [Self Signed Certificate](#self-signed-certificate)
  - [Change the password?](#change-the-password)
  - [How do I securely access development web services?](#how-do-i-securely-access-development-web-services)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

This guide demonstrates how to setup and use `code-server`.
To reiterate, `code-server` lets you run VS Code on a remote server and then access it via a browser.

Further docs are at:

- [README](../README.md) for a general overview
- [INSTALL](../docs/install.md) for installation
- [FAQ](./FAQ.md) for common questions.
- [CONTRIBUTING](../docs/CONTRIBUTING.md) for development docs

We highly recommend reading the [FAQ](./FAQ.md) on the [Differences compared to VS Code](./FAQ.md#differences-compared-to-vs-code) before beginning.

We'll walk you through acquiring a remote machine to run `code-server` on
and then exposing `code-server` so you can securely access it.

## 1. Acquire a remote machine

First, you need a machine to run `code-server` on. You can use a physical
machine you have lying around or use a VM on GCP/AWS.

### Requirements

For a good experience, we recommend at least:

- 1 GB of RAM
- 2 cores

You can use whatever linux distribution floats your boat but in this guide we assume Debian on Google Cloud.

### Google Cloud

For demonstration purposes, this guide assumes you're using a VM on GCP but you should be
able to easily use any machine or VM provider.

You can sign up at https://console.cloud.google.com/getting-started. You'll get a 12 month \$300
free trial.

Once you've signed up and created a GCP project, create a new Compute Engine VM Instance.

1. Navigate to `Compute Engine -> VM Instances` on the sidebar.
2. Now click `Create Instance` to create a new instance.
3. Name it whatever you want.
4. Choose the region closest to you based on [gcping.com](http://www.gcping.com).
5. Any zone is fine.
6. We'd recommend a `E2` series instance from the General-purpose family.
   - Change the type to custom and set at least 2 cores and 2 GB of ram.
   - Add more vCPUs and memory as you prefer, you can edit after creating the instance as well.
   - https://cloud.google.com/compute/docs/machine-types#general_purpose
7. We highly recommend switching the persistent disk to an SSD of at least 32 GB.
   - Click `Change` under `Boot Disk` and change the type to `SSD Persistent Disk` and the size
     to `32`.
   - You can always grow your disk later.
8. Navigate to `Networking -> Network interfaces` and edit the existing interface
   to use a static external IP.
   - Click done to save network interface changes.
9. If you do not have a [project wide SSH key](https://cloud.google.com/compute/docs/instances/adding-removing-ssh-keys#project-wide), navigate to `Security -> SSH Keys` and add your public key there.
10. Click create!

Remember, you can shutdown your server when not in use to lower costs.

We highly recommend learning to use the [`gcloud`](https://cloud.google.com/sdk/gcloud) cli
to avoid the slow dashboard.

## 2. Install code-server

We have a [script](../install.sh) to install `code-server` for Linux, macOS and FreeBSD.

It tries to use the system package manager if possible.

First run to print out the install process:

```bash
curl -fsSL https://code-server.dev/install.sh | sh -s -- --dry-run
```

Now to actually install:

```bash
curl -fsSL https://code-server.dev/install.sh | sh
```

The install script will print out how to run and start using `code-server`.

Docs on the install script, manual installation and docker image are at [./install.md](./install.md).

## 3. Expose code-server

**Never**, **ever** expose `code-server` directly to the internet without some form of authentication
and encryption as someone can completely takeover your machine with the terminal.

By default, `code-server` will enable password authentication which will require you to copy the
password from the`code-server`config file to login. It will listen on`localhost` to avoid exposing
itself to the world. This is fine for testing but will not work if you want to access `code-server`
from a different machine.

There are several approaches to securely operating and exposing `code-server`.

**tip**: You can list the full set of `code-server` options with `code-server --help`

### SSH forwarding

We highly recommend this approach for not requiring any additional setup, you just need an
SSH server on your remote machine. The downside is you won't be able to access `code-server`
on any machine without an SSH client like on iPad. If that's important to you, skip to [Let's Encrypt](#lets-encrypt).

First, ssh into your instance and edit your `code-server` config file to disable password authentication.

```bash
# Replaces "auth: password" with "auth: none" in the code-server config.
sed -i.bak 's/auth: password/auth: none/' ~/.config/code-server/config.yaml
```

Restart `code-server` with (assuming you followed the guide):

```bash
sudo systemctl restart code-server@$USER
```

Now forward local port 8080 to `127.0.0.1:8080` on the remote instance by running the following command on your local machine.

Recommended reading: https://help.ubuntu.com/community/SSH/OpenSSH/PortForwarding.

```bash
# -N disables executing a remote shell
ssh -N -L 8080:127.0.0.1:8080 [user]@<instance-ip>
```

Now if you access http://127.0.0.1:8080 locally, you should see `code-server`!

If you want to make the SSH port forwarding persistent we recommend using
[mutagen](https://mutagen.io/documentation/introduction/installation).

```
# Same as the above SSH command but runs in the background continuously.
# Add `mutagen daemon start` to your ~/.bashrc to start the mutagen daemon when you open a shell.
mutagen forward create --name=code-server tcp:127.0.0.1:8080 <instance-ip>:tcp:127.0.0.1:8080
```

We also recommend adding the following lines to your `~/.ssh/config` to quickly detect bricked SSH connections:

```bash
Host *
ServerAliveInterval 5
ExitOnForwardFailure yes
```

You can also forward your SSH and GPG agent to the instance to securely access GitHub
and sign commits without copying your keys.

1. https://developer.github.com/v3/guides/using-ssh-agent-forwarding/
2. https://wiki.gnupg.org/AgentForwarding

### Let's Encrypt

[Let's Encrypt](https://letsencrypt.org) is a great option if you want to access `code-server` on an iPad
or do not want to use SSH forwarding. This does require that the remote machine be exposed to the internet.

Assuming you have been following the guide, edit your instance and checkmark the allow HTTP/HTTPS traffic options.

1. You'll need to buy a domain name. We recommend [Google Domains](https://domains.google.com).
2. Add an A record to your domain with your instance's IP.
3. Install caddy https://caddyserver.com/docs/download#debian-ubuntu-raspbian.

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/cfg/gpg/gpg.155B6D79CA56EA34.key' | sudo apt-key add -
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/cfg/setup/config.deb.txt?distro=debian&version=any-version' | sudo tee -a /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

4. Replace `/etc/caddy/Caddyfile` with sudo to look like this:

```
mydomain.com

reverse_proxy 127.0.0.1:8080
```

If you want to serve `code-server` from a sub-path, below is sample configuration for Caddy:

```
mydomain.com/code/* {
  uri strip_prefix /code
  reverse_proxy 127.0.0.1:8080
}
```

Remember to replace `mydomain.com` with your domain name!

5. Reload caddy with:

```bash
sudo systemctl reload caddy
```

Visit `https://<your-domain-name>` to access `code-server`. Congratulations!

In a future release we plan to integrate Let's Encrypt directly with `code-server` to avoid
the dependency on caddy.

#### NGINX

If you prefer to use NGINX instead of Caddy then please follow steps 1-2 above and then:

3. Install `nginx`:

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

4. Put the following config into `/etc/nginx/sites-available/code-server` with sudo:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name mydomain.com;

    location / {
      proxy_pass http://localhost:8080/;
      proxy_set_header Host $host;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection upgrade;
      proxy_set_header Accept-Encoding gzip;
    }
}
```

Remember to replace `mydomain.com` with your domain name!

5. Enable the config:

```bash
sudo ln -s ../sites-available/code-server /etc/nginx/sites-enabled/code-server
sudo certbot --non-interactive --redirect --agree-tos --nginx -d mydomain.com -m me@example.com
```

Make sure to substitute `me@example.com` with your actual email.

Visit `https://<your-domain-name>` to access `code-server`. Congratulations!

### Self Signed Certificate

**note:** Self signed certificates do not work with iPad normally. See [./ipad.md](./ipad.md) for details.

Recommended reading: https://security.stackexchange.com/a/8112.

We recommend this as a last resort because self signed certificates do not work with iPads and can
cause other bizarre issues. Not to mention all the warnings when you access `code-server`.
Only use this if:

1. You do not want to buy a domain or you cannot expose the remote machine to the internet.
2. You do not want to use SSH forwarding.

ssh into your instance and edit your code-server config file to use a randomly generated self signed certificate:

```bash
# Replaces "cert: false" with "cert: true" in the code-server config.
sed -i.bak 's/cert: false/cert: true/' ~/.config/code-server/config.yaml
# Replaces "bind-addr: 127.0.0.1:8080" with "bind-addr: 0.0.0.0:443" in the code-server config.
sed -i.bak 's/bind-addr: 127.0.0.1:8080/bind-addr: 0.0.0.0:443/' ~/.config/code-server/config.yaml
# Allows code-server to listen on port 443.
sudo setcap cap_net_bind_service=+ep /usr/lib/code-server/lib/node
```

Assuming you have been following the guide, restart `code-server` with:

```bash
sudo systemctl restart code-server@$USER
```

Edit your instance and checkmark the allow HTTPS traffic option.

Visit `https://<your-instance-ip>` to access `code-server`.
You'll get a warning when accessing but if you click through you should be good.

To avoid the warnings, you can use [mkcert](https://mkcert.dev) to create a self signed certificate
trusted by your OS and then pass it into `code-server` via the `cert` and `cert-key` config
fields.

### Change the password?

Edit the `password` field in the `code-server` config file at `~/.config/code-server/config.yaml`
and then restart `code-server` with:

```bash
sudo systemctl restart code-server@$USER
```

Alternatively, you can specify the SHA-256 of your password at the `hashed-password` field in the config file.
The `hashed-password` field takes precedence over `password`.

### How do I securely access development web services?

If you're working on a web service and want to access it locally, `code-server` can proxy it for you.

See the [FAQ](./FAQ.md#how-do-i-securely-access-web-services).
