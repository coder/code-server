<!-- prettier-ignore-start -->
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# FAQ

- [Questions?](#questions)
- [How should I expose code-server to the internet?](#how-should-i-expose-code-server-to-the-internet)
- [Can I use code-server on the iPad?](#can-i-use-code-server-on-the-ipad)
- [How does the config file work?](#how-does-the-config-file-work)
- [How do I make my keyboard shortcuts work?](#how-do-i-make-my-keyboard-shortcuts-work)
- [Why can't code-server use Microsoft's extension marketplace?](#why-cant-code-server-use-microsofts-extension-marketplace)
- [How can I request an extension that's missing from the marketplace?](#how-can-i-request-an-extension-thats-missing-from-the-marketplace)
- [How do I install an extension?](#how-do-i-install-an-extension)
- [How do I install an extension manually?](#how-do-i-install-an-extension-manually)
- [How do I use my own extensions marketplace?](#how-do-i-use-my-own-extensions-marketplace)
- [Where are extensions stored?](#where-are-extensions-stored)
- [Where is VS Code configuration stored?](#where-is-vs-code-configuration-stored)
- [How can I reuse my VS Code configuration?](#how-can-i-reuse-my-vs-code-configuration)
- [How does code-server decide what workspace or folder to open?](#how-does-code-server-decide-what-workspace-or-folder-to-open)
- [How do I access my Documents/Downloads/Desktop folders in code-server on macOS?](#how-do-i-access-my-documentsdownloadsdesktop-folders-in-code-server-on-macos)
- [How do I direct server-side requests through a proxy?](#how-do-i-direct-server-side-requests-through-a-proxy)
- [How do I debug issues with code-server?](#how-do-i-debug-issues-with-code-server)
- [What is the healthz endpoint?](#what-is-the-healthz-endpoint)
- [What is the heartbeat file?](#what-is-the-heartbeat-file)
- [How do I change the password?](#how-do-i-change-the-password)
- [Can I store my password hashed?](#can-i-store-my-password-hashed)
- [Is multi-tenancy possible?](#is-multi-tenancy-possible)
- [Can I use Docker in a code-server container?](#can-i-use-docker-in-a-code-server-container)
- [How do I disable telemetry?](#how-do-i-disable-telemetry)
- [What's the difference between code-server and Coder?](#whats-the-difference-between-code-server-and-coder)
- [What's the difference between code-server and Theia?](#whats-the-difference-between-code-server-and-theia)
- [What's the difference between code-server and OpenVSCode-Server?](#whats-the-difference-between-code-server-and-openvscode-server)
- [What's the difference between code-server and GitHub Codespaces?](#whats-the-difference-between-code-server-and-github-codespaces)
- [Does code-server have any security login validation?](#does-code-server-have-any-security-login-validation)
- [Are there community projects involving code-server?](#are-there-community-projects-involving-code-server)
- [How do I change the port?](#how-do-i-change-the-port)
- [How do I hide the coder/coder promotion in Help: Getting Started?](#how-do-i-hide-the-codercoder-promotion-in-help-getting-started)
- [How do I disable the proxy?](#how-do-i-disable-the-proxy)
- [How do I disable file download?](#how-do-i-disable-file-download)
- [Why do web views not work?](#why-do-web-views-not-work)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->
<!-- prettier-ignore-end -->

## Questions?

Please file all questions and support requests at
<https://github.com/coder/code-server/discussions>.

## How should I expose code-server to the internet?

Please see [our instructions on exposing code-server safely to the
internet](./guide.md).

## Can I use code-server on the iPad?

See [iPad](./ipad.md) for information on using code-server on the iPad.

## How does the config file work?

When `code-server` starts up, it creates a default config file in `~/.config/code-server/config.yaml`:

```yaml
bind-addr: 127.0.0.1:8080
auth: password
password: mew...22 # Randomly generated for each config.yaml
cert: false
```

The default config defines the following behavior:

- Listen on the loopback IP port 8080
- Enable password authorization
- Do not use TLS

Each key in the file maps directly to a `code-server` flag (run `code-server --help` to see a listing of all the flags). Any flags passed to `code-server`
will take priority over the config file.

You can change the config file's location using the `--config` flag or
`$CODE_SERVER_CONFIG` environment variable.

The default location respects `$XDG_CONFIG_HOME`.

## How do I make my keyboard shortcuts work?

Many shortcuts will not work by default, since they'll be "caught" by the browser.

If you use Chrome, you can work around this by installing the progressive web
app (PWA):

1. Start the editor
2. Click the **plus** icon in the URL toolbar to install the PWA

If you use Firefox, you can use the appropriate extension to install PWA.

1. Go to the installation [website](https://addons.mozilla.org/en-US/firefox/addon/pwas-for-firefox/) of the add-on
2. Add the add-on to Firefox
3. Follow the os-specific instructions on how to install the runtime counterpart

For other browsers, you'll have to remap keybindings for shortcuts to work.

## Why can't code-server use Microsoft's extension marketplace?

Though code-server takes the open-source core of VS Code and allows you to run
it in the browser, it is not entirely equivalent to Microsoft's VS Code.

One major difference is in regards to extensions and the marketplace. The core
of VS code is open source, while the marketplace and many published Microsoft
extensions are not. Furthermore, Microsoft prohibits the use of any
non-Microsoft VS Code from accessing their marketplace. Per the [Terms of
Service](https://cdn.vsassets.io/v/M146_20190123.39/_content/Microsoft-Visual-Studio-Marketplace-Terms-of-Use.pdf):

> Marketplace Offerings are intended for use only with Visual Studio Products
> and Services, and you may only install and use Marketplace Offerings with
> Visual Studio Products and Services.

Because of this, we can't offer any extensions on Microsoft's marketplace.
Instead, we use the [Open-VSX extension gallery](https://open-vsx.org), which is also used by various other forks.
It isn't perfect, but its getting better by the day with more and more extensions.

We also offer our own marketplace for open source extensions, but plan to
deprecate it at a future date and completely migrate to Open-VSX.

These are the closed-source extensions that are presently unavailable:

1. [Live Share](https://visualstudio.microsoft.com/services/live-share). We may
   implement something similar (see
   [#33](https://github.com/coder/code-server/issues/33))
1. [Remote Extensions (SSH, Containers,
   WSL)](https://github.com/microsoft/vscode-remote-release). We may implement
   these again at some point, see
   ([#1315](https://github.com/coder/code-server/issues/1315)).

For more about the closed source portions of VS Code, see [vscodium/vscodium](https://github.com/VSCodium/vscodium#why-does-this-exist).

## How can I request an extension that's missing from the marketplace?

To add an extension to Open-VSX, please see [open-vsx/publish-extensions](https://github.com/open-vsx/publish-extensions).
We no longer plan to add new extensions to our legacy extension gallery.

## How do I install an extension?

You can install extensions from the marketplace using the extensions sidebar in
code-server or from the command line:

```console
code-server --install-extension <extension id>
# example: code-server --install-extension wesbos.theme-cobalt2

# From the Coder extension marketplace
code-server --install-extension ms-python.python

# From a downloaded VSIX on the file system
code-server --install-extension downloaded-ms-python.python.vsix
```

## How do I install an extension manually?

If there's an extension unavailable in the marketplace or an extension that
doesn't work, you can download the VSIX from its GitHub releases or build it
yourself.

Once you have downloaded the VSIX to the remote machine, you can either:

- Run the **Extensions: Install from VSIX** command in the Command Palette.
- Run `code-server --install-extension <path to vsix>` in the terminal

You can also download extensions using the command line. For instance,
downloading from OpenVSX can be done like this:

```shell
code-server --install-extension <extension id>
```

## How do I use my own extensions marketplace?

If you own a marketplace that implements the VS Code Extension Gallery API, you
can point code-server to it by setting `$EXTENSIONS_GALLERY`.
This corresponds directly with the `extensionsGallery` entry in in VS Code's `product.json`.

For example:

```bash
export EXTENSIONS_GALLERY='{"serviceUrl": "https://my-extensions/api"}'
```

Though you can technically use Microsoft's marketplace in this manner, we
strongly discourage you from doing so since this is [against their Terms of Use](#why-cant-code-server-use-microsofts-extension-marketplace).

For further information, see [this
discussion](https://github.com/microsoft/vscode/issues/31168#issue-244533026)
regarding the use of the Microsoft URLs in forks, as well as [VSCodium's
docs](https://github.com/VSCodium/vscodium/blob/master/DOCS.md#extensions--marketplace).

## Where are extensions stored?

Extensions are stored in `~/.local/share/code-server/extensions` by default.

On Linux and macOS if you set the `XDG_DATA_HOME` environment variable, the
extensions directory will be `$XDG_DATA_HOME/code-server/extensions`. In
general, we try to follow the XDG directory spec.

## Where is VS Code configuration stored?

VS Code configuration such as settings and keybindings are stored in
`~/.local/share/code-server` by default.

On Linux and macOS if you set the `XDG_DATA_HOME` environment variable, the data
directory will be `$XDG_DATA_HOME/code-server`. In general, we try to follow the
XDG directory spec.

## How can I reuse my VS Code configuration?

You can use the [Settings
Sync](https://marketplace.visualstudio.com/items?itemName=Shan.code-settings-sync)
extension for this purpose.

Alternatively, you can also pass `--user-data-dir ~/.vscode` or copy `~/.vscode`
into `~/.local/share/code-server` to reuse your existing VS Code extensions and
configuration.

## How does code-server decide what workspace or folder to open?

code-server tries the following in this order:

1. The `workspace` query parameter
2. The `folder` query parameter
3. The workspace or directory passed via the command line
4. The last opened workspace or directory

## How do I access my Documents/Downloads/Desktop folders in code-server on macOS?

Newer versions of macOS require permission through a non-UNIX mechanism for
code-server to access the Desktop, Documents, Pictures, Downloads, and other folders.

You may have to give Node.js full disk access, since it doesn't implement any of the macOS permission request features natively:

1. Find where Node.js is installed on your machine

   ```console
   $ which node
   /usr/local/bin/node
   ```

2. Grant Node.js full disk access. Open **System Preferences** > **Security &
   Privacy** > **Privacy** > **Full Disk Access**. Then, click the 🔒 to unlock,
   click **+**, and select the Node.js binary you located in the previous step.

See [#2794](https://github.com/coder/code-server/issues/2794) for additional context.

## How do I direct server-side requests through a proxy?

> code-server proxies only server-side requests.

To direct server-side requests through a proxy, code-server supports the
following environment variables:

- `$HTTP_PROXY`
- `$HTTPS_PROXY`
- `$NO_PROXY`

```sh
export HTTP_PROXY=https://134.8.5.4
export HTTPS_PROXY=https://134.8.5.4
# Now all of code-server's server side requests will go through
# https://134.8.5.4 first.
code-server
```

- See
  [proxy-from-env](https://www.npmjs.com/package/proxy-from-env#environment-variables)
  for a detailed reference on these environment variables and their syntax (note
  that code-server only uses the `http` and `https` protocols).
- See [proxy-agent](https://www.npmjs.com/package/proxy-agent) for information
  on on the supported proxy protocols.

## How do I debug issues with code-server?

First, run code-server with the `debug` logging (or `trace` to be really
thorough) by setting the `--log` flag or the `LOG_LEVEL` environment variable.
`-vvv` and `--verbose` are aliases for `--log trace`.

First, run code-server with `debug` logging (or `trace` logging for more
thorough messages) by setting the `--log` flag or the `LOG_LEVEL` environment
variable.

```text
code-server --log debug
```

> Note that the `-vvv` and `--verbose` flags are aliases for `--log trace`.

Next, replicate the issue you're having so that you can collect logging
information from the following places:

1. The most recent files from `~/.local/share/code-server/coder-logs`
2. The browser console
3. The browser network tab

Additionally, collecting core dumps (you may need to enable them first) if
code-server crashes can be helpful.

## What is the healthz endpoint?

You can use the `/healthz` endpoint exposed by code-server to check whether
code-server is running without triggering a heartbeat. The response includes a
status (e.g., `alive` or `expired`) and a timestamp for the last heartbeat
(the default is `0`).

```json
{
  "status": "alive",
  "lastHeartbeat": 1599166210566
}
```

This endpoint doesn't require authentication.

## What is the heartbeat file?

As long as there is an active browser connection, code-server touches
`~/.local/share/code-server/heartbeat` once a minute.

If you want to shutdown code-server if there hasn't been an active connection
after a predetermined amount of time, you can do so by checking continuously for
the last modified time on the heartbeat file. If it is older than X minutes (or
whatever amount of time you'd like), you can kill code-server.

Eventually, [#1636](https://github.com/coder/code-server/issues/1636) will make
this process better.

## How do I change the password?

Edit the `password` field in the code-server config file at
`~/.config/code-server/config.yaml`, then restart code-server:

```bash
sudo systemctl restart code-server@$USER
```

## Can I store my password hashed?

Yes, you can do so by setting the value of `hashed-password` instead of `password`. Generate the hash with:

```shell
echo -n "thisismypassword" | npx argon2-cli -e
$argon2i$v=19$m=4096,t=3,p=1$wst5qhbgk2lu1ih4dmuxvg$ls1alrvdiwtvzhwnzcm1dugg+5dto3dt1d5v9xtlws4
```

Replace `thisismypassword` with your actual password and **remember to put it
inside quotes**! For example:

```yaml
auth: password
hashed-password: "$argon2i$v=19$m=4096,t=3,p=1$wST5QhBgk2lu1ih4DMuxvg$LS1alrVdIWtvZHwnzCM1DUGg+5DTO3Dt1d5v9XtLws4"
```

The `hashed-password` field takes precedence over `password`.

If you're using Docker Compose file, in order to make this work, you need to change all the single $ to $$. For example:

```yaml
- HASHED_PASSWORD=$$argon2i$$v=19$$m=4096,t=3,p=1$$wST5QhBgk2lu1ih4DMuxvg$$LS1alrVdIWtvZHwnzCM1DUGg+5DTO3Dt1d5v9XtLws4
```

## Is multi-tenancy possible?

If you want to run multiple code-servers on shared infrastructure, we recommend
using virtual machines (provide one VM per user). This will easily allow users
to run a Docker daemon. If you want to use Kubernetes, you'll want to
use [kubevirt](https://kubevirt.io) or
[sysbox](https://github.com/nestybox/sysbox) to give each user a VM-like
experience instead of just a container.

## Can I use Docker in a code-server container?

If you'd like to access Docker inside of code-server, mount the Docker socket in
from `/var/run/docker.sock`. Then, install the Docker CLI in the code-server
container, and you should be able to access the daemon.

You can even make volume mounts work. Let's say you want to run a container and
mount into `/home/coder/myproject` from inside the `code-server` container. You
need to make sure the Docker daemon's `/home/coder/myproject` is the same as the
one mounted inside the `code-server` container, and the mount will work.

## How do I disable telemetry?

Use the `--disable-telemetry` flag to disable telemetry.

> We use the data collected only to improve code-server.

## What's the difference between code-server and Coder?

code-server and Coder are both applications that can be installed on any
machine. The main difference is who they serve. Out of the box, code-server is
simply VS Code in the browser while Coder is a tool for provisioning remote
development environments via Terraform.

code-server was built for individuals while Coder was built for teams. In Coder, you create Workspaces which can have applications like code-server. If you're looking for a team solution, you should reach for [Coder](https://github.com/coder/coder).

## What's the difference between code-server and Theia?

At a high level, code-server is a patched fork of VS Code that runs in the
browser whereas Theia takes some parts of VS Code but is an entirely different
editor.

[Theia](https://github.com/eclipse-theia/theia) is a browser IDE loosely based
on VS Code. It uses the same text editor library
([Monaco](https://github.com/Microsoft/monaco-editor)) and extension API, but
everything else is different. Theia also uses [Open VSX](https://open-vsx.org)
for extensions.

Theia doesn't allow you to reuse your existing VS Code config.

## What's the difference between code-server and OpenVSCode-Server?

code-server and OpenVSCode-Server both allow you to access VS Code via a
browser. OpenVSCode-Server is a direct fork of VS Code with changes comitted
directly while code-server pulls VS Code in via a submodule and makes changes
via patch files.

However, OpenVSCode-Server is scoped at only making VS Code available as-is in
the web browser. code-server contains additional changes to make the self-hosted
experience better (see the next section for details).

## What's the difference between code-server and GitHub Codespaces?

Both code-server and GitHub Codespaces allow you to access VS Code via a
browser. GitHub Codespaces, however, is a closed-source, paid service offered by
GitHub and Microsoft.

On the other hand, code-server is self-hosted, free, open-source, and can be run
on any machine with few limitations.

Specific changes include:

- Password authentication
- The ability to host at sub-paths
- Self-contained web views that do not call out to Microsoft's servers
- The ability to use your own marketplace and collect your own telemetry
- Built-in proxy for accessing ports on the remote machine integrated into
  VS Code's ports panel
- Wrapper process that spawns VS Code on-demand and has a separate CLI
- Notification when updates are available
- [Some other things](https://github.com/coder/code-server/tree/main/patches)

Some of these changes appear very unlikely to ever be adopted by Microsoft.
Some may make their way upstream, further closing the gap, but at the moment it
looks like there will always be some subtle differences.

## Does code-server have any security login validation?

code-server supports setting a single password and limits logins to two per
minute plus an additional twelve per hour.

## Are there community projects involving code-server?

Visit the [awesome-code-server](https://github.com/coder/awesome-code-server)
repository to view community projects and guides with code-server! Feel free to
add your own!

## How do I change the port?

There are two ways to change the port on which code-server runs:

1. with an environment variable e.g. `PORT=3000 code-server`
2. using the flag `--bind-addr` e.g. `code-server --bind-addr localhost:3000`

## How do I hide the coder/coder promotion in Help: Getting Started?

You can pass the flag `--disable-getting-started-override` to `code-server` or
you can set the environment variable `CS_DISABLE_GETTING_STARTED_OVERRIDE=1` or
`CS_DISABLE_GETTING_STARTED_OVERRIDE=true`.

## How do I disable the proxy?

You can pass the flag `--disable-proxy` to `code-server` or
you can set the environment variable `CS_DISABLE_PROXY=1` or
`CS_DISABLE_PROXY=true`.

Note, this option currently only disables the proxy routes to forwarded ports, including
the domain and path proxy routes over HTTP and WebSocket; however, it does not
disable the automatic port forwarding in the VS Code workbench itself. In other words,
user will still see the Ports tab and notifications, but will not be able to actually
use access the ports. It is recommended to set `remote.autoForwardPorts` to `false`
when using the option.

## How do I disable file download?

You can pass the flag `--disable-file-downloads` to `code-server`

## Why do web views not work?

Web views rely on service workers, and service workers are only available in a
secure context, so most likely the answer is that you are using an insecure
context (for example an IP address).

If this happens, in the browser log you will see something like:

> Error loading webview: Error: Could not register service workers: SecurityError: Failed to register a ServiceWorker for scope with script: An SSL certificate error occurred when fetching the script..

To fix this, you must either:

- Access over localhost/127.0.0.1 which is always considered secure.
- Use a domain with a real certificate (for example with Let's Encrypt).
- Use a trusted self-signed certificate with [mkcert](https://mkcert.dev) (or
  create and trust a certificate manually).
- Disable security if your browser allows it. For example, in Chromium see
  `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
