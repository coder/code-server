<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# Setup Guide

- [1. Acquire a remote machine](#1-acquire-a-remote-machine)
  - [Requirements](#requirements)
  - [Google Cloud Platform](#google-cloud-platform)
- [2. Install code-server](#2-install-code-server)
- [3. Expose code-server](#3-expose-code-server)
  - [SSH forwarding](#ssh-forwarding)
  - [Let's Encrypt](#lets-encrypt)
  - [Self Signed Certificate](#self-signed-certificate)
  - [Change the password?](#change-the-password)
  - [How do I securely access development web services?](#how-do-i-securely-access-development-web-services)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

This guide demonstrates how to setup and use code-server.
To reiterate, code-server lets you run VS Code on a remote server and then access it via a browser.

See the [README](../README.md) for a general overview and the [FAQ](./FAQ.md) for further user docs.

We'll walk you through acquiring a remote machine to run code-server on and then exposing `code-server` so you can
easily access it.

## 1. Acquire a remote machine

First, you need a machine to run code-server on. You can use a physical
machine you have lying around or use a VM on GCP/AWS.

### Requirements

For a good experience, we recommend at least:

- 1 GB of RAM
- 2 cores

You can use whatever linux distribution floats your boat but in this guide we assume Debian.

### Google Cloud Platform

For demonstration purposes, this guide assumes you're using a VM on GCP but you should be
able to easily use any machine or VM provider.

You can sign up at https://console.cloud.google.com/getting-started. You'll get a 12 month \$300
free trial.

Once you've signed up and created a GCP project, create a new Compute Engine VM Instance.

1. Navigate to `Compute Engine -> VM Instances` on the sidebar
2. Now click `Create Instance` to create a new instance
3. Choose the region closest to you based on [gcping.com](http://www.gcping.com)
4. Name it whatever you want
5. Any zone is fine
6. We'd recommend a `e2-standard-2` instance from the E2 series and General-purpose family
   - Add more vCPUs and memory as you prefer, you can edit after creating the instance as well
   - https://cloud.google.com/compute/docs/machine-types#general_purpose
7. We highly recommend switching the persistent disk to a SSD of at least 32 GB
8. Navigate to `Networking -> Network interfaces` and edit the existing interface
   to use a static external IP
   - Click done to save network interface changes
9. If you do not have a [project wide SSH key](https://cloud.google.com/compute/docs/instances/adding-removing-ssh-keys#project-wide), navigate to `Security - > SSH Keys` and add your public key there
10. Click create!

Remember, you can shutdown your server when not in use to lower costs.
We highly recommend learning to use the [`gcloud`](https://cloud.google.com/sdk/gcloud) cli
to avoid the slow dashboard.

## 2. Install code-server

SSH into your instance and run the appropriate commands documented in [README.md](../README.md).

Assuming Debian:

```bash
curl -sSOL https://github.com/cdr/code-server/releases/download/3.3.0/code-server_3.3.0_amd64.deb
sudo dpkg -i code-server_3.3.0_amd64.deb
systemctl --user enable --now code-server
# Now code-server is running at http://127.0.0.1:8080
# Your password is in ~/.config/code-server/config.yaml
```

## 3. Expose code-server

There are several approaches to operating and exposing code-server.

Since you can gain access to a terminal from within code-server, **never**, **ever**
expose it directly to the internet without some form of authentication and encryption!

By default, code-server will enable password authentication which will
require you to copy the password from the code-server config file to login. You
can also set a custom password with `$PASSWORD`.

**tip**: You can list the full set of code-server options with `code-server --help`

### SSH forwarding

We highly recommend this approach for not requiring any additional setup, you just need an
SSH server on your remote machine. The downside is you won't be able to access `code-server`
without an SSH client like an iPad. If that's important to you, skip to [Let's Encrypt](#lets-encrypt).

Recommended reading: https://help.ubuntu.com/community/SSH/OpenSSH/PortForwarding

```bash
# -N disables executing a remote shell
ssh -N -L 8080:127.0.0.1:8080 <instance-ip>
```

As long as this command hasn't exited, that means any request on local port 8080 goes to your
instance at `127.0.0.1:8080` which is where code-server is running.

Next ssh into your instance and edit your code-server config file to disable password authentication.

```bash
# Replaces "auth: password" with "auth: none" in the code-server config.
sed -i.bak 's/auth: password/auth: none/' ~/.config/code-server/config.yaml
```

Restart code-server with (assuming you followed the guide):

```bash
systemctl --user restart code-server
```

Now if you access http://127.0.0.1:8080 locally, you should see code-server!

If you want to make the SSH port forwarding persistent we recommend using
[mutagen](https://mutagen.io/documentation/introduction/installation).

```
# Same as the above SSH command but runs in the background continously.
# Add `mutagen daemon start` to your ~/.bashrc to start the mutagen daemon when you open a shell.
mutagen forward create --help -n=code-server tcp:127.0.0.1:8080 <instance-ip>:tcp:127.0.0.1:8080
```

We also recommend adding the following lines to your `~/.ssh/config` to quickly detect bricked SSH connections:

```bash
Host *
ServerAliveInterval 5
ExitOnForwardFailure yes
```

You can also forward your SSH key and GPG agent to the instance to securely access GitHub
and sign commits without copying your keys onto the instance.

1. https://developer.github.com/v3/guides/using-ssh-agent-forwarding/
2. https://wiki.gnupg.org/AgentForwarding

### Let's Encrypt

Let's Encrypt is a great option if you want to access code-server on an iPad or just want password
based authentication. This does require that the remote machine is exposed to the internet.

Assuming you have been following the guide, edit your instance and checkmark the allow HTTP/HTTPS traffic options.

1. You'll need to buy a domain name. We recommend [Google Domains](https://domains.google.com)
2. Add an A record to your domain with your instance's IP
3. Install caddy https://caddyserver.com/docs/download#debian-ubuntu-raspbian

```bash
echo "deb [trusted=yes] https://apt.fury.io/caddy/ /" \
    | sudo tee -a /etc/apt/sources.list.d/caddy-fury.list
sudo apt update
sudo apt install caddy
```

4. Replace `/etc/caddy/Caddyfile` with sudo to look like this:

```
mydomain.com

reverse_proxy 127.0.0.1:8080
```

5. Reload caddy with:

```bash
sudo systemctl reload caddy
```

Visit `https://<your-instance-ip>` to access code-server. Congratulations!

In a future release we plan to integrate Let's Encrypt directly with code-server to avoid
the dependency on caddy.

### Self Signed Certificate

**note:** Self signed certificates do not work with iPad and will cause a blank page. You'll
have to use [Let's Encrypt](#lets-encrypt) instead.

Recommended reading: https://security.stackexchange.com/a/8112

We recommend this as a last resort as self signed certificates do not work with iPads and can
cause other bizarre issues. Not to mention all the warnings when you access code-server.
Only use this if you do not want to buy a domain or cannot expose the remote machine to the internet.

ssh into your instance and edit your code-server config file to use a randomly generated self signed certificate:

```bash
# Replaces "cert: false" with "cert: true" in the code-server config.
sed -i.bak 's/cert: false/cert: true/' ~/.config/code-server/config.yaml
# Replaces "bind-addr: 127.0.0.1:8080" with "bind-addr: 0.0.0.0:443" in the code-server config.
sed -i.bak 's/bind-addr: 127.0.0.1:8080/bind-addr: 0.0.0.0:443/' ~/.config/code-server/config.yaml
# Allows code-server to listen on port 443.
sudo setcap cap_net_bind_service=+ep /usr/lib/code-server/lib/node
```

Assuming you have been following the guide, restart code-server with:

```bash
systemctl --user restart code-server
```

Edit your instance and checkmark the allow HTTPS traffic option.

Visit `https://<your-instance-ip>` to access code-server.
You'll get a warning when accessing but if you click through you should be good.

You can also use [mkcert](https://mkcert.dev) to create a self signed certificate trusted by your
OS to avoid the warnings.

### Change the password?

Edit the code-server config file at `~/.config/code-server/config.yaml` and then restart
code-server with:

```bash
systemctl --user restart code-server
```

### How do I securely access development web services?

If you're working on a web service and want to access it locally, code-server can proxy it for you.

See the [FAQ](https://github.com/cdr/code-server/blob/master/doc/FAQ.md#how-do-i-securely-access-web-services).
