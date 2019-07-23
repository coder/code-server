# Quickstart Guide
1. Visit the [releases page](https://github.com/cdr/code-server/releases) and
   download the latest binary for your operating system.
2. Unpack the downloaded file then run the binary.
3. In your browser navigate to `localhost:8443`.

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
      proxy_pass http://localhost:8443/;
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
  RewriteRule /(.*)           ws://localhost:8443/$1 [P,L]
  RewriteCond %{HTTP:Upgrade} !=websocket [NC]
  RewriteRule /(.*)           http://localhost:8443/$1 [P,L]

  ProxyRequests off

  RequestHeader set X-Forwarded-Proto https
  RequestHeader set X-Forwarded-Port 443

  ProxyPass / http://localhost:8443/ nocanon
  ProxyPassReverse / http://localhost:8443/

</VirtualHost>
```
