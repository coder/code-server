# code-server

[!["Open Issues"](https://img.shields.io/github/issues-raw/cdr/code-server.svg)](https://github.com/cdr/code-server/issues)
[!["Latest Release"](https://img.shields.io/github/release/cdr/code-server.svg)](https://github.com/cdr/code-server/releases/latest)
[![MIT license](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/cdr/code-server/blob/master/LICENSE)
[![Discord](https://img.shields.io/discord/463752820026376202.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/zxSwN8Z)

`code-server` is [VS Code](https://github.com/Microsoft/vscode) running on a remote server, accessible through the browser.

Try it out:
```bash
docker run -it -p 127.0.0.1:8443:8443 -v "${PWD}/code-server:/home/coder" codercom/code-server --allow-http --no-auth
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

**Run as Non-root user dynamically mapped at runtime in docker**
You can configure code server to run as a UID:GID of your choice. This uses the [boxboat/fixuid](https://github.com/boxboat/fixuid) utility to dynmaically remap the coder uid/gid at runtime. This is especially useful in environments where UIDs change, affect volume mount permissions, and process ownership. You can enable this feature easily with env variables, and the `docker -u` cli flag.

WARNING: there are some concerns around [security](https://github.com/boxboat/fixuid/issues/1) with this approach, ensure you understand the implications

Example 1: Run as the host UID:GID, by setting the FIXUID docker env var
```bash
docker run -it -p 127.0.0.1:8443:8443 \
-v "${PWD}/code-server:/home/coder" \
-u $(id -u):$(id -g) \
-e FIXUID=y \
codercom/code-server:latest --allow-http --no-auth
```

Example 2: Same as above, but disable the fixuid warning message
```bash
docker run -it -p 127.0.0.1:8443:8443 \
-v "${PWD}/code-server:/home/coder" \
-u $(id -u):$(id -g) \
-e FIXUID=y \
-e FIXUID_QUIET=y \
codercom/code-server:latest --allow-http --no-auth
```



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
