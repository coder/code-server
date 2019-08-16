# Generate a Self-signed Certificate 🔒

code-server has the ability to secure your connection between client and server
using SSL/TSL certificates. By default, the server will start with an
unencrypted connection. We recommend Self-signed TLS/SSL certificates for
personal use of code-server or within an organization.

This guide will show you how to create a self-signed certificate and start
code-server using your certificate/key.

## TLS / HTTPS

You can specify any location that you want to save the certificate and key. In
this example, we will navigate to the root directory, create a folder called
`certs` and cd into it.

```shell
mkdir ~/certs && cd ~/certs
```

If you don't already have a TLS certificate and key, you can generate them with
the command below. They will be placed in `~/certs`.

```shell
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ~/certs/MyKey.key -out ~/certs/MyCertificate.crt
```

You will be prompted to add some identifying information about your
organization:

```shell
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [AU]:US
State or Province Name (full name) [Some-State]:TX
Locality Name (eg, city) []:Austin
Organization Name (eg, company) [Coder Technologies]:Coder
Organizational Unit Name (eg, section) []:Docs
Common Name (e.g. server FQDN or YOUR name) []:hostname.example.com
Email Address []:admin@example.com
```

> If you already have a TLS certificate and key, you can simply reference them
> in the `--cert` and `--cert-key` flags when launching code-server.


## Starting code-server with a Certificate and Key

Just add the `--cert` and `--cert-key` flags when you run code-server:

```shell
./code-server --cert=~/certs/MyCertificate.crt --cert-key=~/certs/MyKey.key
```

> You should check that the
> `WARN  No certificate specified. This could be insecure` are no longer visible
> in the output.

## Other Options

For larger organizations you may wish to rely on a trusted Certificate Authority
as opposed to a self-signed certificate. For more information on generating free
and open certificates for your site, please check out EFF's
[certbot](https://certbot.eff.org/). Certbot is a cli to generate certificates
using [LetsEncrypt](https://letsencrypt.org/).
