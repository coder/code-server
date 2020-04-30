# app

Implementation of [VS Code](https://code.visualstudio.com/) remote/web for use
in `code-server`.

## Docker

To debug Golang in VS Code using the
[ms-vscode-go extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode.Go),
you need to add `--security-opt seccomp=unconfined` to your `docker run`
arguments when launching code-server with Docker. See
[#725](https://github.com/cdr/code-server/issues/725) for details.

## Known Issues

- Creating custom VS Code extensions and debugging them doesn't work.
- Extension profiling and tips are currently disabled.

## Extensions

`code-server` does not provide access to the official
[Visual Studio Marketplace](https://marketplace.visualstudio.com/vscode). Instead,
Coder has created a custom extension marketplace that we manage for open-source
extensions. If you want to use an extension with code-server that we do not have
in our marketplace please look for a release in the extension’s repository,
contact us to see if we have one in the works or, if you build an extension
locally from open source, you can copy it to the `extensions` folder. If you
build one locally from open-source please contribute it to the project and let
us know so we can give you props! If you have your own custom marketplace, it is
possible to point code-server to it by setting the `SERVICE_URL` and `ITEM_URL`
environment variables.

## Development: upgrading VS Code

We patch VS Code to provide and fix some functionality. As the web portion of VS
Code matures, we'll be able to shrink and maybe even entirely eliminate our
patch. In the meantime, however, upgrading the VS Code version requires ensuring
that the patch still applies and has the intended effects.

If functionality doesn't depend on code from VS Code then it should be moved
into code-server otherwise it should be in the patch.

To generate a new patch, **stage all the changes** you want to be included in
the patch in the VS Code source, then run `yarn vscode:diff` in this
directory.

Notable changes include:

- Add our own build file which includes our code and VS Code's web code.
- Allow multiple extension directories (both user and built-in).
- Modify the loader, websocket, webview, service worker, and asset requests to
  use the URL of the page as a base (and TLS if necessary for the websocket).
- Send client-side telemetry through the server.
- Make changing the display language work.
- Make it possible for us to load code on the client.
- Make extensions work in the browser.
- Make it possible to install extensions of any kind.
- Fix getting permanently disconnected when you sleep or hibernate for a while.
- Add connection type to web socket query parameters.

## Future

- Run VS Code unit tests against our builds to ensure features work as expected.
