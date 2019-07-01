# code-server

[!["Open Issues"](https://img.shields.io/github/issues-raw/cdr/code-server.svg)](https://github.com/cdr/code-server/issues)
[!["Latest Release"](https://img.shields.io/github/release/cdr/code-server.svg)](https://github.com/cdr/code-server/releases/latest)
[![MIT license](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/cdr/code-server/blob/master/LICENSE)
[![Discord](https://img.shields.io/discord/463752820026376202.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/zxSwN8Z)

`code-server` is [VS Code](https://github.com/Microsoft/vscode) running on a remote server, accessible through the browser.

Try it out:
```bash
docker run -it -p 127.0.0.1:8443:8443 -v "${PWD}:/home/coder/project" codercom/code-server --allow-http --no-auth
```

- Code on your Chromebook, tablet, and laptop with a consistent dev environment.
	- If you have a Windows or Mac workstation, more easily develop for Linux.
- Take advantage of large cloud servers to speed up tests, compilations, downloads, and more.
- Preserve battery life when you're on the go.
	- All intensive computation runs on your server.
	- You're no longer running excess instances of Chrome.

![Screenshot](/doc/assets/ide.png)

## Getting Started

### Run over SSH

Use [sshcode](https://github.com/codercom/sshcode) for a simple setup.

### Docker

See docker oneliner mentioned above. Dockerfile is at [/Dockerfile](/Dockerfile).

### Binaries

1.  [Download a binary](https://github.com/cdr/code-server/releases) (Linux and OS X supported. Windows coming soon)
2.  Start the binary with the project directory as the first argument

    ```
    code-server <initial directory to open>
    ```
	> You will be prompted to enter the password shown in the CLI
	`code-server` should now be running at https://localhost:8443.

	> code-server uses a self-signed SSL certificate that may prompt your browser to ask you some additional questions before you proceed. Please [read here](doc/self-hosted/index.md) for more information.

For detailed instructions and troubleshooting, see the [self-hosted quick start guide](doc/self-hosted/index.md).

Quickstart guides for [Google Cloud](doc/admin/install/google_cloud.md), [AWS](doc/admin/install/aws.md), and [DigitalOcean](doc/admin/install/digitalocean.md).

How to [secure your setup](/doc/security/ssl.md).

## Development

### Known Issues

- Creating custom VS Code extensions and debugging them doesn't work.
- To debug Golang using [ms-vscode-go extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode.Go), you need to add `--security-opt seccomp=unconfined` to your `docker run` arguments when launching code-server with Docker. See [#725](https://github.com/cdr/code-server/issues/725) for details.

### Future
- **Stay up to date!** Get notified about new releases of code-server.
  ![Screenshot](/doc/assets/release.gif)
- Windows support.
- Electron and Chrome OS applications to bridge the gap between local<->remote.
- Run VS Code unit tests against our builds to ensure features work as expected.

### Extensions

At the moment we can't use the official VSCode Marketplace. We've created a custom extension marketplace focused around open-sourced extensions. However, if you have access to the `.vsix` file, you can manually install the extension.

## Telemetry

Use the `--disable-telemetry` flag or set `DISABLE_TELEMETRY=true` to disable tracking ENTIRELY.

We use data collected to improve code-server.

## Contributing

Development guides are coming soon.

## License

[MIT](LICENSE)

## Enterprise

Visit [our enterprise page](https://coder.com/enterprise) for more information about our enterprise offering.

## Commercialization

If you would like to commercialize code-server, please contact contact@coder.com.
