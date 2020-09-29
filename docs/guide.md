<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# Setup Guide

- [Setup Guide](#setup-guide)
  - [Step 1: Set up the host machine](#step-1-set-up-the-host-machine)
  - [Step 2: Install code-server](#step-2-install-code-server)
  - [Step 3: Expose code-server](#step-3-expose-code-server)
    - [SSH Forwarding](#ssh-forwarding)
    - [Let's Encrypt](#lets-encrypt)
      - [Let's Encrypt with NGINX](#lets-encrypt-with-nginx)
    - [Self-Signed Certificates](#self-signed-certificates)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

This guide walks you through the process of setting up and using code-server, allowing you to run VS Code on any machine anywhere and access it using a web browser.

## Step 1: Set up the host machine

You can run code-server on a machine in your possession or using a virtual machine hosted by Google, Amazon, etc.

We recommend the following as a minimum:

- 1 GB of RAM
- 2 CPU cores

Code-server works with most Linux distributions, but for this guide, we assume that you're using Debian on a virtual machine hosted by Google Cloud.

1. Sign up for a Google Cloud Platform account, and create a new project (you can name the project whatever you'd like, and there's no need to select an organization for the project).
2. In the left-hand navigation bar, go to **Compute Engine** > **VM Instances**
3. Click **Create** to create a new VM instance
4. Provide a **name** for your new VM.
5. Choose the **region** that's located closest to you, as well as a **zone** (Google should automatically make suggestions on the options that are best for you)
6. Under **Machine Configuration**, we recommend an **E2** series instance from the **general-purpose** family
7. For **Machine Type**, select **Custom**. We recommend adding at least 2 vCPU and 2 GB of RAM (you can add more at a later time if necessary)
8. Optional: we highly recommend switching the persistent disk to a solid-state drive with at least 32 GB of space. To do so, go to **Boot disk** and click **Change**. Under **Boot disk type**, select **SSD persistent disk** and set **Size (GB)** to **32**
9. Click the **Management, security, disks, networking, sole tenancy** link to expand additional config options for your instance.
10. Edit the interface so that it uses a static external IP address. To do so, go to **Networking** > **Networking interfaces**. Under **External IP**, click **Create IP address**. In the pop-up window, provide a name and click **reserve**. Then, click **Done**
11. If you aren't already using a [project-wide SSH key](https://cloud.google.com/compute/docs/instances/adding-removing-ssh-keys#project-wide), switch to **Security** > **SSH Keys**. Provide your **SSH key** in the box provided
12. Click **Create** to proceed.

Once GCP creates your instance, it's ready to use.

## Step 2: Install code-server

To install code-server, run:

```bash
curl -fsSL https://code-server.dev/install.sh | sh
```

The install script will print out how to start and run code-server.

## Step 3: Expose code-server

Once you have code-server started and running, you'll need to expose it to be accessible from web browsers.

**Note:** Never expose code-server directly to the Internet without some form of authentication and encryption because somebody can take over your machine using the terminal.

By default, code-server enables password authentication. You'll need to copy the password from the code-server config file and use that to log in. code-server listens on localhost to avoid exposing itself; this is fine for testing, but it doesn't work if you want to access code-server from a different machine.

There are several ways of securing exposing and operating code-server:

1. SSH Forwarding
2. Let's Encrypt

### SSH Forwarding

SSH forwarding is a good option if you want something that requires minimal setup. However, you must have an SSH Server on your remote machine and an SSH client on the device accessing code-server.

To set up SSH forwarding:

1. SSH into the instance hosting code-server. Edit the code-server config file to disable password authentication:

```bash
# Replaces "auth: password" with "auth: none" in the code-server config.
sed -i.bak 's/auth: password/auth: none/' ~/.config/code-server/config.yaml
```

2. Restart code-server:

```bash
sudo systemctl restart code-server@$USER
```

3. [Forward](https://help.ubuntu.com/community/SSH/OpenSSH/PortForwarding) the local port 8080 to **127.0.0.1:8080** on the remote instance by running the following on your local machine (*not* the machine on which code-server runs):

```bash
# -N disables executing a remote shell
ssh -N -L 8080:127.0.0.1:8080 [user]@<instance-ip>
```

At this point, you can access code-server from your local machine using **http://127.0.0.1:8080**.

You can make the SSH port forwarding persistent using something like [mutagen](https://mutagen.io/documentation/introduction/installation):

```
# This is the same as the above SSH command, but it runs in the background continuously.
# Add `mutagen daemon start` to your ~/.bashrc to start the mutagen daemon when you open a shell.
mutagen forward create --name=code-server tcp:127.0.0.1:8080 <instance-ip>:tcp:127.0.0.1:8080
```

We also recommend adding the following to your `~/.ssh/config** file to detect bricked SSH connections:

```bash
Host *
ServerAliveInterval 5
ExitOnForwardFailure yes
```

You can also forward your [SSH](https://developer.github.com/v3/guides/using-ssh-agent-forwarding/) and [gpg-agent](https://wiki.gnupg.org/AgentForwarding) to the instance, allowing you to access GitHub securely and sign commits without copying your keys.

### Let's Encrypt

Let's Encrypt is an option if you want to access code-server on an iPad or don't want to use SSH forwarding.

To use Let's Encrypt, you must expose the remote machine to the Internet. You will also need to have a domain name; if you don't already, please purchase one before proceeding.

1. In the Google Cloud Platform dashboard, go to **Compute Engine** > **VM Instances** using the left-hand toolbar. Click to open up your instance.
2. Click **Edit** at the top, and scroll down to the Firewalls section; make sure that you check both the **Allow HTTP traffic** and **Allow HTTPS traffic** boxes. Scroll to the bottom of the page and click **Save**.
3. Add an A record to your domain name that includes your instance's IP address.
4. Install [caddy](https://caddyserver.com/docs/download#debian-ubuntu-raspbian)

```bash
echo "deb [trusted=yes] https://apt.fury.io/caddy/ /" \
    | sudo tee -a /etc/apt/sources.list.d/caddy-fury.list
sudo apt update
sudo apt install caddy
```

5. Replace `/etc/caddy/Caddyfile` with sudo to look like this:

```text
mydomain.com
reverse_proxy 127.0.0.1:8080
```

Be sure to replace the `mydomain.com` placeholder with your domain name.

6. Reload Caddy:

```bash
sudo systemctl reload caddy
```

You can now visit your domain to access code-server.

#### Let's Encrypt with NGINX

You can also use NGINX instead of Caddy for port forwarding:

3. Install NGINX:

```bash
sudo apt update
sudo apt install -y nginx certbot python-certbot-nginx
```

4. Add the following configuration information into the **`/etc/nginx/sites-available/code-server** file:

```text
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

Be sure to replace the `mydomain.com` placeholder with your domain.

5. Enable your newly updated configuration:

```bash
sudo ln -s ../sites-available/code-server /etc/nginx/sites-enabled/code-server
sudo certbot --non-interactive --redirect --agree-tos --nginx -d mydomain.com -m me@example.com
```

Be sure to replace the `mydomain.com` and `me@example.com` placeholders with your domain and email, respectively.

At this point, you can visit **https://<your-domain-name>** to access code-server.

### Self-Signed Certificates

As a last resort, you can use self-signed certificates with code-server. We recommend this option only if you don't want to:

- Buy a domain name or can't expose the remote machine to the Internet
- Use SSH forwarding

Note that self-signed certificates don't work with iPads, can [be risky security-wise](https://security.stackexchange.com/questions/8110/what-are-the-risks-of-self-signing-a-certificate-for-ssl), and may cause other issues with functionality.

1. SSH into your instance and edit the code-server config file to use a randomly generated, self-signed certificate:

```bash
# Replaces "cert: false" with "cert: true" in the code-server config.
sed -i.bak 's/cert: false/cert: true/' ~/.config/code-server/config.yaml
# Replaces "bind-addr: 127.0.0.1:8080" with "bind-addr: 0.0.0.0:443" in the code-server config.
sed -i.bak 's/bind-addr: 127.0.0.1:8080/bind-addr: 0.0.0.0:443/' ~/.config/code-server/config.yaml
# Allows code-server to listen on port 443.
sudo setcap cap_net_bind_service=+ep /usr/lib/code-server/lib/node
```

Restart code-server:

```bash
sudo systemctl restart code-server@$USER
```

2. In the Google Cloud Platform dashboard, go to **Compute Engine** > **VM Instances** using the left-hand toolbar. Click to open up your instance. Click **Edit** at the top, and scroll down to the Firewalls section; make sure that you check both the **Allow HTTP traffic** and **Allow HTTPS traffic** boxes. Scroll to the bottom of the page and click **Save**.

Visit `https://<your-instance-ip>` to access code-server.

Your browser may display a warning, but you can continue by clicking through. To prevent future warnings, you can use [mkcert](https://mkcert.dev) to create a self-signed certificate that's trusted by your OS, then pass it into code-server via the `cert` and `cert-key` config fields.
