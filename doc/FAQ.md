<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# FAQ

- [Questions?](#questions)
- [iPad Status?](#ipad-status)
- [How can I reuse my VS Code configuration?](#how-can-i-reuse-my-vs-code-configuration)
- [Differences compared to VS Code?](#differences-compared-to-vs-code)
- [How can I request a missing extension?](#how-can-i-request-a-missing-extension)
- [How do I configure the marketplace URL?](#how-do-i-configure-the-marketplace-url)
- [Where are extensions stored?](#where-are-extensions-stored)
- [How is this different from VS Code Codespaces?](#how-is-this-different-from-vs-code-codespaces)
- [How should I expose code-server to the internet?](#how-should-i-expose-code-server-to-the-internet)
- [How do I securely access web services?](#how-do-i-securely-access-web-services)
  - [Sub-paths](#sub-paths)
  - [Sub-domains](#sub-domains)
- [Multi-tenancy](#multi-tenancy)
- [Docker in code-server container?](#docker-in-code-server-container)
- [How can I disable telemetry?](#how-can-i-disable-telemetry)
- [How does code-server decide what workspace or folder to open?](#how-does-code-server-decide-what-workspace-or-folder-to-open)
- [How do I debug issues with code-server?](#how-do-i-debug-issues-with-code-server)
- [Heartbeat File](#heartbeat-file)
- [Healthz endpoint](#healthz-endpoint)
- [How does the config file work?](#how-does-the-config-file-work)
- [How do I customize the "Go Home" button?](#how-do-i-customize-the-go-home-button)
- [Isn't an install script piped into sh insecure?](#isnt-an-install-script-piped-into-sh-insecure)
- [How do I make my keyboard shortcuts work?](#how-do-i-make-my-keyboard-shortcuts-work)
- [Differences compared to Theia?](#differences-compared-to-theia)
- [Enterprise](#enterprise)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Questions?

Please file all questions and support requests at https://github.com/cdr/code-server/discussions.

## iPad Status?

Please see [./ipad.md](./ipad.md).

## How can I reuse my VS Code configuration?

The very popular [Settings Sync](https://marketplace.visualstudio.com/items?itemName=Shan.code-settings-sync) extension works.

You can also pass `--user-data-dir ~/.vscode` to reuse your existing VS Code extensions and configuration.

Or copy `~/.vscode` into `~/.local/share/code-server`.

## Differences compared to VS Code?

`code-server` takes the open source core of VS Code and allows you to run it in the browser.
However, it is not entirely equivalent to Microsoft's VS Code.

While the core of VS Code is open source, the marketplace and many published Microsoft extensions are not.

Furthermore, Microsoft prohibits the use of any non-Microsoft VS Code from accessing their marketplace.

See the [TOS](https://cdn.vsassets.io/v/M146_20190123.39/_content/Microsoft-Visual-Studio-Marketplace-Terms-of-Use.pdf).

> Marketplace Offerings are intended for use only with Visual Studio Products and Services
> and you may only install and use Marketplace Offerings with Visual Studio Products and Services.

As a result, we cannot offer any extensions on the Microsoft marketplace. Instead,
we have created our own marketplace for open source extensions.
It works by scraping GitHub for VS Code extensions and building them. It's not perfect but getting
better by the day with more and more extensions.

These are the closed source extensions presently unavailable:

1. [Live Share](https://visualstudio.microsoft.com/services/live-share)
   - We may implement something similar, see [#33](https://github.com/cdr/code-server/issues/33)
1. [Remote Extensions (SSH, Containers, WSL)](https://github.com/microsoft/vscode-remote-release)
   - We may reimplement these at some point, see [#1315](https://github.com/cdr/code-server/issues/1315)

For more about the closed source parts of VS Code, see [vscodium/vscodium](https://github.com/VSCodium/vscodium#why-does-this-exist).

## How can I request a missing extension?

Please open a new issue and select the `Extension request` template.

If an extension is not available or does not work, you can grab its VSIX from its Github releases or
build it yourself. Then run the `Extensions: Install from VSIX` command in the Command Palette and
point to the .vsix file.

See below for installing an extension from the cli.

## How do I configure the marketplace URL?

If you have your own marketplace that implements the VS Code Extension Gallery API, it is possible to
point code-server to it by setting `$SERVICE_URL` and `$ITEM_URL`. These correspond directly
to `serviceUrl` and `itemUrl` in VS Code's `product.json`.

e.g. to use [open-vsx.org](https://open-vsx.org):

```bash
export SERVICE_URL=https://open-vsx.org/vscode/gallery
export ITEM_URL=https://open-vsx.org/vscode/item
```

While you can technically use Microsoft's marketplace with these, please do not do so as it
is against their terms of use. See [above](#differences-compared-to-vs-code) and this
discussion regarding the use of the Microsoft URLs in forks:

https://github.com/microsoft/vscode/issues/31168#issue-244533026

These variables are most valuable to our enterprise customers for whom we have a self hosted marketplace product.

## Where are extensions stored?

Defaults to `~/.local/share/code-server/extensions`.

If the `XDG_DATA_HOME` environment variable is set the data directory will be
`$XDG_DATA_HOME/code-server/extensions`. In general we try to follow the XDG directory spec.

You can install an extension on the CLI with:

```bash
# From the Coder extension marketplace
code-server --install-extension ms-python.python

# From a downloaded VSIX on the file system
code-server --install-extension downloaded-ms-python.python.vsix
```

## How is this different from VS Code Codespaces?

VS Code Codespaces is a closed source and paid service by Microsoft. It also allows you to access
VS Code via the browser.

However, code-server is free, open source and can be run on any machine without any limitations.

While you can self host environments with VS Code Codespaces, you still need an Azure billing
account and you have to access VS Code via the Codespaces web dashboard instead of directly
connecting to your instance.

## How should I expose code-server to the internet?

Please follow [./guide.md](./guide.md) for our recommendations on setting up and using code-server.

code-server only supports password authentication natively.

**note**: code-server will rate limit password authentication attempts at 2 a minute and 12 an hour.

If you want to use external authentication (i.e sign in with Google) you should handle this
with a reverse proxy using something like [oauth2_proxy](https://github.com/pusher/oauth2_proxy)
or [Cloudflare Access](https://teams.cloudflare.com/access).

For HTTPS, you can use a self signed certificate by passing in just `--cert` or
pass in an existing certificate by providing the path to `--cert` and the path to
the key with `--cert-key`.

The self signed certificate will be generated into
`~/.local/share/code-server/self-signed.crt`.

If `code-server` has been passed a certificate it will also respond to HTTPS
requests and will redirect all HTTP requests to HTTPS.

You can use [Let's Encrypt](https://letsencrypt.org/) to get a TLS certificate
for free.

Again, please follow [./guide.md](./guide.md) for our recommendations on setting up and using code-server.

## How do I securely access web services?

code-server is capable of proxying to any port using either a subdomain or a
subpath which means you can securely access these services using code-server's
built-in authentication.

### Sub-paths

Just browse to `/proxy/<port>/`.

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

## Multi-tenancy

If you want to run multiple code-servers on shared infrastructure, we recommend using virtual
machines with a VM per user. This will easily allow users to run a docker daemon. If you want
to use kubernetes, you'll definitely want to use [kubevirt](https://kubevirt.io) to give each
user a virtual machine instead of just a container.

## Docker in code-server container?

If you'd like to access docker inside of code-server, mount the docker socket in from `/var/run/docker.sock`.
Install the docker CLI in the code-server container and you should be able to access the daemon!

You can even make volume mounts work. Lets say you want to run a container and mount in
`/home/coder/myproject` into it from inside the `code-server` container. You need to make sure
the docker daemon's `/home/coder/myproject` is the same as the one mounted inside the `code-server`
container and the mount will just work.

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

1. The most recent files from `~/.local/share/code-server/coder-logs`.
2. The most recently created directory in the `~/.local/share/code-server/logs` directory.
3. The browser console and network tabs.

Additionally, collecting core dumps (you may need to enable them first) if
code-server crashes can be helpful.

## Heartbeat File

`code-server` touches `~/.local/share/code-server/heartbeat` once a minute as long
as there is an active browser connection.

If you want to shutdown `code-server` if there hasn't been an active connection in X minutes
you can do so by continuously checking the last modified time on the heartbeat file and if it is
older than X minutes, kill `code-server`.

[#1636](https://github.com/cdr/code-server/issues/1636) will make the experience here better.

## Healthz endpoint

`code-server` exposes an endpoint at `/healthz` which can be used to check
whether `code-server` is up without triggering a heartbeat. The response will
include a status (`alive` or `expired`) and a timestamp for the last heartbeat
(defaults to `0`). This endpoint does not require authentication.

```json
{
  "status": "alive",
  "lastHeartbeat": 1599166210566
}
```

## How does the config file work?

When `code-server` starts up, it creates a default config file in `~/.config/code-server/config.yaml` that looks
like this:

```yaml
bind-addr: 127.0.0.1:8080
auth: password
password: mewkmdasosafuio3422 # This is randomly generated for each config.yaml
cert: false
```

Each key in the file maps directly to a `code-server` flag. Run `code-server --help` to see
a listing of all the flags.

The default config here says to listen on the loopback IP port 8080, enable password authorization
and no TLS. Any flags passed to `code-server` will take priority over the config file.

The `--config` flag or `$CODE_SERVER_CONFIG` can be used to change the config file's location.

The default location also respects `$XDG_CONFIG_HOME`.

## How do I customize the "Go Home" button?

You can pass a URL to the `--home` flag like this:
```
code-server --home=https://my-website.com
```

Or you can define it in the config file with `home`.

## Isn't an install script piped into sh insecure?

Please give
[this wonderful blogpost](https://sandstorm.io/news/2015-09-24-is-curl-bash-insecure-pgp-verified-install) by
[sandstorm.io](https://sandstorm.io) a read.

## How do I make my keyboard shortcuts work?

Many shortcuts will not work by default as they'll be caught by the browser.

If you use Chrome you can get around this by installing the PWA.

Once you've entered the editor, click the "plus" icon present in the URL toolbar area.
This will install a Chrome PWA and now all keybindings will work!

For other browsers you'll have to remap keybindings unfortunately.

## Differences compared to Theia?

[Theia](https://github.com/eclipse-theia/theia) is a browser IDE loosely based on VS Code. It uses the same
text editor library named [Monaco](https://github.com/Microsoft/monaco-editor) and the same
extension API but everything else is very different. It also uses [open-vsx.org](https://open-vsx.org)
for extensions which has an order of magnitude less extensions than our marketplace.
See [#1473](https://github.com/cdr/code-server/issues/1473).

You can't just use your VS Code config in Theia like you can with code-server.

To summarize, code-server is a patched fork of VS Code to run in the browser whereas
Theia takes some parts of VS Code but is an entirely different editor.

## Enterprise

Visit [our enterprise page](https://coder.com) for more information about our
enterprise offerings.
