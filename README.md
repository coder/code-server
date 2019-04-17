# code-server

[!["Open Issues"](https://img.shields.io/github/issues-raw/codercom/code-server.svg)](https://github.com/codercom/code-server/issues)
[!["Latest Release"](https://img.shields.io/github/release/codercom/code-server.svg)](https://github.com/codercom/code-server/releases/latest)
[![MIT license](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/codercom/code-server/blob/master/LICENSE)
[![Discord](https://img.shields.io/discord/463752820026376202.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/zxSwN8Z)

`code-server` is [VS Code](https://github.com/Microsoft/vscode) running on a remote server, accessible through the browser.

Try it out:

```bash
docker run -it -p 127.0.0.1:8443:8443 -v "${PWD}:/home/coder/project" codercom/code-server:1.621 --allow-http --no-auth
```

- Code on your Chromebook, tablet, and laptop with a consistent dev environment. - If you have a Windows or Mac workstation, more easily develop for Linux.
- Take advantage of large cloud servers to speed up tests, compilations, downloads, and more.
- Preserve battery life when you're on the go. - All intensive computation runs on your server. - You're no longer running excess instances of Chrome.

![Screenshot](/doc/assets/ide.png)

## Getting Started

### Docker

See docker oneliner mentioned above. Dockerfile is at [/Dockerfile](/Dockerfile).

### Binaries

1.  [Download a binary](https://github.com/codercom/code-server/releases) (Linux and OS X supported. Windows coming soon)
2.  Start the binary with the project directory as the first argument

    ```
    code-server <initial directory to open>
    ```

    > You will be prompted to enter the password shown in the CLI
    > `code-server` should now be running at https://localhost:8443.

    > code-server uses a self-signed SSL certificate that may prompt your browser to ask you some additional questions before you proceed. Please [read here](doc/self-hosted/index.md) for more information.

For detailed instructions and troubleshooting, see the [self-hosted quick start guide](doc/self-hosted/index.md).

Quickstart guides for [Google Cloud](doc/admin/install/google_cloud.md), [AWS](doc/admin/install/aws.md), and [Digital Ocean](doc/admin/install/digitalocean.md).

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

## Contributing

### Building from source

There are two ways to build `code-server` from source. You can either build the Docker image using `docker` or build natively for your platform. You can not cross-build for a different platform.

We recommend you build the docker image as this is less error prone and easier than building natively.

To build a docker image clone the code-server repository and run

```shell
docker build -t codercom/code-server:development .
# to build the image, then run
docker run -it -p 127.0.0.1:8443:8443 -v "${PWD}:/home/coder/project" codercom/code-server:development --allow-http --no-auth
# to start the development server. to shut it down press CTRL + C (or CMD + C on macOS)
```

To build natively clone the code-server repository and run

```shell
node --version # make sure you have v10.15.1
npm install -g yarn@1.13
yarn
yarn task build:server:binary # depending on your system this can take up to 15 minutes
```

your binary can be found in packages/server and is in the format cli-OS-ARCH (cli-linux-x64)

> Building natively only works on macOS and Linux (Ubuntu 18.04 is validated to work). Windows is currently not supported (see issue #259).

If you want to test with the service-worker and PWA enabled during development, please run `export NODE_ENV=production` before building. Use Chrome 72+, enable [allow-insecure-localhost](chrome://flags/#allow-insecure-localhost) and enable [unsafely-treat-insecure-origin-as-secure](chrome://flags/#unsafely-treat-insecure-origin-as-secure) and enter `localhost:8443` in its textbox.

## License

[MIT](LICENSE)

## Enterprise

Visit [our enterprise page](https://coder.com/enterprise) for more information about our enterprise offering.

## Commercialization

If you would like to commercialize code-server, please contact contact@coder.com.
