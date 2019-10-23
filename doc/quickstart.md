# Quickstart Guide
1. Visit the [releases page](https://github.com/cdr/code-server/releases) and
   download the latest binary for your operating system.
2. Unpack the downloaded file then run the binary.
3. In your browser navigate to `localhost:8080`.

## Usage
Run `code-server --help` to view available options.

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
Description=Code Server IDE
After=network.target

[Service]
Type=simple
User=<USER>
EnvironmentFile=$HOME/.profile
WorkingDirectory=$HOME
Restart=on-failure
RestartSec=10

ExecStart=<PATH TO BINARY> $(pwd)

StandardOutput=file:/var/log/code-server-output.log
StandardError=file:/var/log/code-server-error.log

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
