# FAQ

## Questions?

Please file all questions and support requests at https://www.reddit.com/r/codeserver/
The issue tracker is only for bugs.

## What's the deal with extensions?

Unfortunately, the Microsoft VS Code Marketplace license prohibits use with any non Microsoft
product.

See https://cdn.vsassets.io/v/M146_20190123.39/_content/Microsoft-Visual-Studio-Marketplace-Terms-of-Use.pdf

> Marketplace Offerings are intended for use only with Visual Studio Products and Services
> and you may only install and use Marketplace Offerings with Visual Studio Products and Services.

As a result, Coder has created its own marketplace for open source extensions. It works by scraping
GitHub for VS Code extensions and building them. It's not perfect but getting better by the day with
more and more extensions.

Issue [#1299](https://github.com/cdr/code-server/issues/1299) is a big one in making the experience here
better by allowing the community to submit extensions and repos to avoid waiting until the scraper finds
an extension.

If an extension does not work, try to grab its VSIX from its Github releases or build it yourself and
copy it to the extensions folder.

## How is this different from VS Code Online?

VS Code Online is a closed source managed service by Microsoft and only runs on Azure.

code-server is open source and can be freely run on any machine.

## How should I expose code-server to the internet?

By far the most secure method of using code-server is via
[sshcode](https://github.com/codercom/sshcode) as it runs code-server and then forwards
its port over SSH and requires no setup on your part other than having a working SSH server.

You can also forward your SSH key and GPG agent to the remote machine to securely access GitHub
and securely sign commits without duplicating your keys onto the the remote machine.

1. https://developer.github.com/v3/guides/using-ssh-agent-forwarding/
1. https://wiki.gnupg.org/AgentForwarding

If you cannot use sshcode, then you will need to ensure there is some sort of authorization in
front of code-server and that you are using HTTPS to secure all connections.

By default when listening externally, code-server enables password authentication using a
randomly generated password so you can use that. You can set the `PASSWORD` environment variable
to use your own instead. If you want to handle authentication yourself, use `--auth none`
to disable password authentication.

**note**: code-server will rate limit password authentication attempts at 2 a minute and 12 an hour.

If you want to use external authentication you should handle this with a reverse
proxy using something like [oauth2_proxy](https://github.com/pusher/oauth2_proxy).

For HTTPS, you can use a self signed certificate by passing in just `--cert` or pass in an existing
certificate by providing the path to `--cert` and the path to its key with `--cert-key`.

If `code-server` has been passed a certificate it will also respond to HTTPS
requests and will redirect all HTTP requests to HTTPS. Otherwise it will respond
only to HTTP requests.

You can use [Let's Encrypt](https://letsencrypt.org/) to get an SSL certificate
for free.

## How do I securely access web services?

code-server is capable of proxying to any port using either a subdomain or a
subpath which means you can securely access these services using code-server's
built-in authentication.

### Sub-domains

You will need a DNS entry that points to your server for each port you want to
access. You can either set up a wildcard DNS entry for `*.<domain>` if your domain
name registrar supports it or you can create one for every port you want to
access (`3000.<domain>`, `8080.<domain>`, etc).

You should also set up TLS certificates for these subdomains, either using a
wildcard certificate for `*.<domain>` or individual certificates for each port.

Start code-server with the `--proxy-domain` flag set to your domain.

```
code-server --proxy-domain <domain>
```

Now you can browse to `<port>.<domain>`. Note that this uses the host header so
ensure your reverse proxy forwards that information if you are using one.

### Sub-paths

Just browse to `/proxy/<port>/`.

## x86 releases?

node has dropped support for x86 and so we decided to as well. See
[nodejs/build/issues/885](https://github.com/nodejs/build/issues/885).

## Alpine builds?

Just install `libc-dev` and code-server should work.

## Multi Tenancy

If you want to run multiple code-server's on shared infrastructure, we recommend using virtual
machines with a VM per user. This will easily allow users to run a docker daemon. If you want
to use kubernetes, you'll definitely want to use [kubevirt](https://kubevirt.io) to give each
user a virtual machine instead of just a container. Docker in docker while supported requires
privileged containers which are a security risk in a multi tenant infrastructure.

## Docker in code-server docker container?

If you'd like to access docker inside of code-server, we'd recommend running a docker:dind container
and mounting in a directory to share between dind and the code-server container at /var/run. After, install
the docker CLI in the code-server container and you should be able to access the daemon as the socket
will be shared at /var/run/docker.sock.

In order to make volume mounts work, mount the home directory in the code-server container and the
dind container at the same path. i.e you'd volume mount a directory from the host to `/home/coder`
on both. This will allow any volume mounts in the home directory to work. Similar process
to make volume mounts in any other directory work.

## Collaboration

At the moment we have no plans for multi user collaboration on code-server but we understand there is strong
demand and will work on it when the time is right.

## How can I disable telemetry?

Use the `--disable-telemetry` flag to completely disable telemetry. We use the
data collected only to improve code-server.

## How does code-server decide what workspace or folder to open?

code-server tries the following in order:

1. The `workspace` query parameter.
2. The `folder` query parameter.
3. The workspace or directory passed on the command line.
4. The last opened workspace or directory.

## How do I debug issues with code-server?

First run code-server with at least `debug` logging (or `trace` to be really
thorough) by setting the `--log` flag or the `LOG_LEVEL` environment variable.
`-vvv` and `--verbose` are aliases for `--log trace`.

```
code-server --log debug
```

Once this is done, replicate the issue you're having then collect logging
information from the following places:

1. stdout.
2. The most recently created directory in the `logs` directory (found in the
   data directory; see below for how to find that).
3. The browser console and network tabs.

Additionally, collecting core dumps (you may need to enable them first) if
code-server crashes can be helpful.

### Where is the data directory?

If the `XDG_DATA_HOME` environment variable is set the data directory will be
`$XDG_DATA_HOME/code-server`. Otherwise:

1. Unix: `~/.local/share/code-server`
1. Windows: `%APPDATA%\Local\code-server\Data`

## Enterprise

Visit [our enterprise page](https://coder.com) for more information about our
enterprise offerings.
