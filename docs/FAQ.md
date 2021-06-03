<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# FAQ

- [Questions?](#questions)
- [iPad Status?](#ipad-status)
- [Community Projects (awesome-code-server)](#community-projects-awesome-code-server)
- [How can I reuse my VS Code configuration?](#how-can-i-reuse-my-vs-code-configuration)
- [Differences compared to VS Code?](#differences-compared-to-vs-code)
  - [Installing an extension](#installing-an-extension)
- [How can I request a missing extension?](#how-can-i-request-a-missing-extension)
- [Installing an extension manually](#installing-an-extension-manually)
- [How do I configure the marketplace URL?](#how-do-i-configure-the-marketplace-url)
- [Where are extensions stored?](#where-are-extensions-stored)
- [How is this different from VS Code Codespaces?](#how-is-this-different-from-vs-code-codespaces)
- [How should I expose code-server to the internet?](#how-should-i-expose-code-server-to-the-internet)
- [Can I store my password hashed?](#can-i-store-my-password-hashed)
- [How do I securely access web services?](#how-do-i-securely-access-web-services)
  - [Sub-paths](#sub-paths)
  - [Sub-domains](#sub-domains)
- [Why does the code-server proxy strip `/proxy/<port>` from the request path?](#why-does-the-code-server-proxy-strip-proxyport-from-the-request-path)
  - [Proxying to Create React App](#proxying-to-create-react-app)
- [Multi-tenancy](#multi-tenancy)
- [Docker in code-server container?](#docker-in-code-server-container)
- [How can I disable telemetry?](#how-can-i-disable-telemetry)
- [How does code-server decide what workspace or folder to open?](#how-does-code-server-decide-what-workspace-or-folder-to-open)
- [How do I debug issues with code-server?](#how-do-i-debug-issues-with-code-server)
- [Heartbeat File](#heartbeat-file)
- [Healthz endpoint](#healthz-endpoint)
- [How does the config file work?](#how-does-the-config-file-work)
- [Isn't an install script piped into sh insecure?](#isnt-an-install-script-piped-into-sh-insecure)
- [How do I make my keyboard shortcuts work?](#how-do-i-make-my-keyboard-shortcuts-work)
- [How do I access my Documents/Downloads/Desktop folders in code-server on OSX?](#how-do-i-access-my-documentsdownloadsdesktop-folders-in-code-server-on-osx)
- [Differences compared to Theia?](#differences-compared-to-theia)
- [`$HTTP_PROXY`, `$HTTPS_PROXY`, `$NO_PROXY`](#http_proxy-https_proxy-no_proxy)
- [Enterprise](#enterprise)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Questions?

Please file all questions and support requests at <https://github.com/cdr/code-server/discussions>.

## iPad Status?

Please see [./ipad.md](./ipad.md).

## Community Projects (awesome-code-server)

Visit the [awesome-code-server](https://github.com/cdr/awesome-code-server) repository to view community projects and guides with code-server! Feel free to add your own!

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

### Installing an extension

Extensions can be installed from the marketplace using the extensions sidebar in
code-server or from the command line:

```shell
code-server --install-extension <extension id>
# example: code-server --install-extension wesbos.theme-cobalt2
```

## How can I request a missing extension?

We are currently in the process of transitioning to [Open VSX](https://open-vsx.org/).
Once <https://github.com/eclipse/openvsx/issues/249>
is implemented, we can fully make this transition. Therefore, we are no longer
accepting new requests for extension requests.

Instead, we suggest one of the following:

- [Switch to Open VSX](#how-do-i-configure-the-marketplace-url) now
- Download and [install the extension manually](#installing-an-extension-manually)

## Installing an extension manually

If an extension is not available from the marketplace or does not work, you can
grab its VSIX from its GitHub releases or build it yourself.

Once you have downloaded the VSIX to the remote machine you can either:

- Run the `Extensions: Install from VSIX` command in the Command Palette.
- Use `code-server --install-extension <path to vsix>`

You can also download extensions from the command line. For instance, downloading off OpenVSX can be done like this:

```shell
SERVICE_URL=https://open-vsx.org/vscode/gallery ITEM_URL=https://open-vsx.org/vscode/item code-server --install-extension <extension id>
```

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

<https://github.com/microsoft/vscode/issues/31168#issue-244533026>

See also [VSCodium's docs](https://github.com/VSCodium/vscodium/blob/master/DOCS.md#extensions--marketplace).

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
with a reverse proxy using something like [Pomerium](https://www.pomerium.io/guides/code-server.html), [oauth2_proxy](https://github.com/pusher/oauth2_proxy)
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

## Can I store my password hashed?

Yes you can! Set the value of `hashed-password` instead of `password`. Generate the hash with:

```shell
echo -n "password" | npx argon2-cli -e
$argon2i$v=19$m=4096,t=3,p=1$wst5qhbgk2lu1ih4dmuxvg$ls1alrvdiwtvzhwnzcm1dugg+5dto3dt1d5v9xtlws4
```

Of course replace `thisismypassword` with your actual password and **remember to put it inside quotes**!

Example:

```yaml
auth: password
hashed-password: "$argon2i$v=19$m=4096,t=3,p=1$wST5QhBgk2lu1ih4DMuxvg$LS1alrVdIWtvZHwnzCM1DUGg+5DTO3Dt1d5v9XtLws4"
```

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

## Why does the code-server proxy strip `/proxy/<port>` from the request path?

HTTP servers should strive to use relative URLs to avoid needed to be coupled to the
absolute path at which they are served. This means you must use trailing slashes on all
paths with subpaths. See <https://blog.cdivilly.com/2019/02/28/uri-trailing-slashes>

This is really the "correct" way things work and why the striping of the base path is the
default. If your application uses relative URLs and does not assume the absolute path at
which it is being served, it will just work no matter what port you decide to serve it off
or if you put it in behind code-server or any other proxy!

However many people prefer the cleaner aesthetic of no trailing slashes. This couples you
to the base path as you cannot use relative redirects correctly anymore. See the above
link.

For users who are ok with this tradeoff, use `/absproxy` instead and the path will be
passed as is. e.g. `/absproxy/3000/my-app-path`

### Proxying to Create React App

You must use `/absproxy/<port>` with create-react-app.
See [#2565](https://github.com/cdr/code-server/issues/2565) and
[#2222](https://github.com/cdr/code-server/issues/2222). You will need to inform
create-react-app of the path at which you are serving via `$PUBLIC_URL` and webpack
via `$WDS_SOCKET_PATH`.

e.g.

```sh
PUBLIC_URL=/absproxy/3000 \
  WDS_SOCKET_PATH=$PUBLIC_URL/sockjs-node \
  BROWSER=none yarn start
```

Then visit `https://my-code-server-address.io/absproxy/3000` to see your app exposed through
code-server!

Highly recommend using the subdomain approach instead to avoid this class of issue.

## Multi-tenancy

If you want to run multiple code-servers on shared infrastructure, we recommend using virtual
machines with a VM per user. This will easily allow users to run a docker daemon. If you want
to use kubernetes, you'll definitely want to use [kubevirt](https://kubevirt.io) or [sysbox](https://github.com/nestybox/sysbox) to give each
user a VM-like experience instead of just a container.

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
2. The browser console.
3. The browser network tab.

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

## How do I access my Documents/Downloads/Desktop folders in code-server on OSX?

Newer versions of macOS require permission through a non-UNIX mechanism for access to the Desktop, Documents, Pictures, Downloads, and other folders.

You may have to give Node "full disk access" since it doesn't implement any of the macOS permission request stuff natively.

1. Find where Node is installed on your machine

   ```console
   ➜ ~ which node
   /usr/local/bin/node
   ```

1. Grant Node Full Disk Access:

Open System Preferences > Security & Privacy > Privacy (horizontal) tab > Full Disk Access (vertical) tab > Click the 🔒 to unlock > Click + and select the Node binary you located.

See [#2794](https://github.com/cdr/code-server/issues/2794) for context on this.

## Differences compared to Theia?

[Theia](https://github.com/eclipse-theia/theia) is a browser IDE loosely based on VS Code. It uses the same
text editor library named [Monaco](https://github.com/Microsoft/monaco-editor) and the same
extension API but everything else is very different. It also uses [open-vsx.org](https://open-vsx.org)
for extensions which has an order of magnitude less extensions than our marketplace.
See [#1473](https://github.com/cdr/code-server/issues/1473).

You can't just use your VS Code config in Theia like you can with code-server.

To summarize, code-server is a patched fork of VS Code to run in the browser whereas
Theia takes some parts of VS Code but is an entirely different editor.

## `$HTTP_PROXY`, `$HTTPS_PROXY`, `$NO_PROXY`

code-server supports the standard environment variables to allow directing
server side requests through a proxy.

```sh
export HTTP_PROXY=https://134.8.5.4
export HTTPS_PROXY=https://134.8.5.4
# Now all of code-server's server side requests will go through
# https://134.8.5.4 first.
code-server
```

- See [proxy-from-env](https://www.npmjs.com/package/proxy-from-env#environment-variables)
  for a detailed reference on the various environment variables and their syntax.
  - code-server only uses the `http` and `https` protocols.
- See [proxy-agent](https://www.npmjs.com/package/proxy-agent) for the various supported
  proxy protocols.

**note**: Only server side requests will be proxied! This includes fetching extensions,
requests made from extensions etc. To proxy requests from your browser you need to
configure your browser separately. Browser requests would cover exploring the extension
marketplace.

## Enterprise

Visit [our enterprise page](https://coder.com) for more information about our
enterprise offerings.
