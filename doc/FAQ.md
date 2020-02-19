# FAQ

## What's the deal with extensions?

Unfortunately, the Microsoft VS Code Marketplace is

## How is this different from VS Code Online?

VS Code Online is a closed source managed service by Microsoft and only runs on Azure.

code-server is open source and can be freely ran on any machine.

## How should I expose code-server to the internet?

By far the most secure method of using code-server is via
[sshcode](https://github.com/codercom/sshcode) as it runs code-server and then forwards
its port over SSH and requires no setup on your part other than having a working SSH server.

If you cannot use sshcode, then you will need to ensure there is some sort of authorization in
front of code-server and that you are using HTTPS to secure all connections.

By default when listening externally, code-server enables password authentication using a
randomly generated password so you can use that. You can set the `PASSWORD` environment variable
to use your own instead. If you want to handle authentication yourself, use `--auth none`
to disable password authentication.

For HTTPS, you can use a self signed certificate by passing in just `--cert` or pass in an existing
certificate by providing the path to `--cert` and the path to its key with `--cert-key`.

If `code-server` has been passed a certificate it will also respond to HTTPS
requests and will redirect all HTTP requests to HTTPS. Otherwise it will respond
only to HTTP requests.

You can use [Let's Encrypt](https://letsencrypt.org/) to get an SSL certificate
for free.

## Why are there x86 releases?

32 bit releases have been

## Multi Tenancy

If you want to run multiple code-server's on shared infrastructure, we recommend using
something like kubernetes and the code-server docker image.

## How can I disable telemetry?

Use the `--disable-telemetry` flag to completely disable telemetry. We use the
data collected only to improve code-server.
