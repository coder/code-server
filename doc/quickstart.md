# Quickstart Guide
1. Visit the [releases page](https://github.com/cdr/code-server/releases) and
   download the latest binary for your operating system.
2. Unpack the downloaded file then run the binary.
3. In your browser navigate to `localhost:8080`.

## Usage
Run `code-server --help` to view available options.

### Encrypting traffic with HTTPS
To encrypt the traffic between the browser and server use `code-server --cert`
followed by the path to your certificate. Additionally, you can use certificate
keys with `--cert-key` followed by the path to your key. If you pass `--cert`
without any path code-server will generate a self-signed certificate.

You can use [Let's Encrypt](https://letsencrypt.org/) to get an SSL certificate
for free.

### Nginx Reverse Proxy
The trailing slashes are important.

```
server {
  listen 80;
  listen [::]:80;
  server_name code.example.com code.example.org;
  location /some/path/ { # Or / if hosting at the root.
      proxy_pass http://localhost:8080/;
      proxy_set_header Host $host;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection upgrade;
      proxy_set_header Accept-Encoding gzip;
  }
}
```

### Apache Reverse Proxy
```
<VirtualHost *:80>
  ServerName code.example.com

  RewriteEngine On
  RewriteCond %{HTTP:Upgrade} =websocket [NC]
  RewriteRule /(.*)           ws://localhost:8080/$1 [P,L]
  RewriteCond %{HTTP:Upgrade} !=websocket [NC]
  RewriteRule /(.*)           http://localhost:8080/$1 [P,L]

  ProxyRequests off
  ProxyPass        / http://localhost:8080/ nocanon
  ProxyPassReverse / http://localhost:8080/
</VirtualHost>
```

### Run automatically at startup

In some cases you might need to run code-server automatically once the host starts. You may use your local init service to do so.

#### Systemd

```ini
[Unit]

Description=VSCode in a browser

After=network.target

[Service]

Type=simple

ExecStart=/usr/bin/code-server $(pwd)

WorkingDirectory=$HOME/projects

ExecStop=/sbin/start-stop-daemon --stop -x /usr/bin/code-server

Restart=on-failure

User=1000

[Install]

WantedBy=multi-user.target
```

#### OpenRC

```sh
#!/sbin/openrc-run

depend() {
    after net-online
    need net
}

supervisor=supervise-daemon
name="code-server"
command="/opt/cdr/code-server"
command_args=""

pidfile="/var/run/cdr.pid"
respawn_delay=5

set -o allexport
if [ -f /etc/environment ]; then source /etc/environment; fi
set +o allexport
```

#### Kubernetes/Docker

Make sure you set your restart policy to always - this will ensure your container starts as the daemon starts.
