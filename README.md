# code-server

[!["Open Issues"](https://img.shields.io/github/issues-raw/codercom/code-server.svg)](https://github.com/codercom/code-server/issues)
[!["Latest Release"](https://img.shields.io/github/release/codercom/code-server.svg)](https://github.com/codercom/code-server/releases/latest)
[![MIT license](https://img.shields.io/badge/license-MIT-green.svg)](#)
[![Discord](https://discordapp.com/api/guilds/463752820026376202/widget.png)](https://discord.gg/zxSwN8Z)

`code-server` is [VS Code](https://github.com/Microsoft/vscode) running on a remote server, accessible through the browser.

Try it out:
```bash
docker run -t -p 127.0.0.1:8443:8443 -v "${PWD}:/root/project" codercom/code-server --allow-http --no-auth
```

- Code on your Chromebook, tablet, and laptop with a consistent dev environment.
	- If you have a Windows or Mac workstation, more easily develop for Linux.
- Take advantage of large cloud servers to speed up tests, compilations, downloads, and more.
- Preserve battery life when you're on the go.
	- All intensive computation runs on your server.
	- You're no longer running excess instances of Chrome.

![Screenshot](/doc/assets/ide.png)

## Getting Started

### Hosted

[Try `code-server` now](https://coder.com/signup) for free at coder.com.

### Docker

See docker oneliner mentioned above. Dockerfile is at [/Dockerfile](/Dockerfile).

### Binaries

1.  [Download a binary](https://github.com/codercom/code-server/releases) (Linux and OSX supported. Windows coming soon)
2.  Start the binary with the project directory as the first argument

    ```
    code-server <initial directory to open>
    ```
	> You will be prompted to enter the password shown in the CLI
	`code-server` should now be running at https://localhost:8443.

	> code-server uses a self-signed SSL certificate that may prompt your browser to ask you some additional questions before you proceed. Please [read here](doc/self-hosted/index.md) for more information.

For detailed instructions and troubleshooting, see the [self-hosted quick start guide](doc/self-hosted/index.md).

Quickstart guides for [Google Cloud](doc/admin/install/google_cloud.md), [AWS](doc/admin/install/aws.md), and [Digital Ocean](doc/admin/install/digitalocean.md).

How to [secure your setup](/doc/security/ssl.md).

## Development

### Known Issues

- Creating custom VS Code extensions and debugging them doesn't work.

### Future

- Windows support.
- Electron and ChromeOS applications to bridge the gap between local<->remote.
- Run VS Code unit tests against our builds to ensure features work as expected.

## Contributing

Development guides are coming soon.

## License

[MIT](LICENSE)

## Enterprise

Visit [our enterprise page](https://coder.com/enterprise) for more information about our enterprise offering.

## Commercialization

If you would like to commercialize code-server, please contact contact@coder.com.
