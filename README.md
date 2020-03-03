# code-server

`code-server` is [VS Code](https://github.com/Microsoft/vscode) running on a
remote server, accessible through the browser.

Try it out:

```bash
docker run -it -p 127.0.0.1:8080:8080 -v "$PWD:/home/coder/project" codercom/code-server
```

- **Code anywhere:** Code on your Chromebook, tablet, and laptop with a
  consistent dev environment. Develop on a Linux machine and pick up from any
  device with a web browser.
- **Server-powered:** Take advantage of large cloud servers to speed up tests,
  compilations, downloads, and more. Preserve battery life when you're on the go
  since all intensive computation runs on your server.

![Example gif](/doc/assets/code-server.gif)

## Getting Started

### Requirements

- 64-bit host.
- At least 1GB of RAM.
- 2 cores or more are recommended (1 core works but not optimally).
- Secure connection over HTTPS or localhost (required for service workers and
  clipboard support).
- For Linux: GLIBC 2.17 or later and GLIBCXX 3.4.15 or later.

### Run over SSH

Use [sshcode](https://github.com/codercom/sshcode) for a simple setup.

### Digital Ocean

[![Create a Droplet](./doc/assets/droplet.svg)](https://marketplace.digitalocean.com/apps/code-server?action=deploy)

### Releases

1. [Download a release](https://github.com/cdr/code-server/releases). (Linux and
   OS X supported. Windows support planned.)
2. Unpack the downloaded release then run the included `code-server` script.
3. In your browser navigate to `localhost:8080`.

## FAQ

See [./doc/FAQ.md](./doc/FAQ.md).

## Enterprise

Visit [our enterprise page](https://coder.com) for more information about our
enterprise offerings.
