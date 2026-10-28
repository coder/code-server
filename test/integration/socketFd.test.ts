import { ChildProcess, spawn } from "child_process"
import { promises as fs } from "fs"
import * as http from "http"
import * as net from "net"
import * as path from "path"
import { clean, tmpdir } from "../utils/helpers"

describe("--socket-fd", () => {
  const testName = "socketFd"
  const codeServerPath = process.env.CODE_SERVER_PATH || path.resolve("../../release-standalone/bin/code-server")
  let tempDir: string
  let socketDir: string | undefined
  let child: ChildProcess | undefined

  beforeEach(async () => {
    await clean(testName)
    tempDir = await tmpdir(testName)
  })

  afterEach(async () => {
    if (child?.pid && child.exitCode === null) {
      // Kill the process group so that the wrapper's inner process also stops.
      process.kill(-child.pid, "SIGKILL")
    }
    if (socketDir) {
      await fs.rm(socketDir, { force: true, recursive: true })
      socketDir = undefined
    }
  })

  // Give the listener to code-server as fd 3, as systemd socket activation does.
  const getHealthzThroughFd = async (server: net.Server, target: http.RequestOptions): Promise<number> => {
    const fd: number = (server as any)._handle.fd
    let output = ""
    child = spawn(
      codeServerPath,
      [
        "--socket-fd=3",
        "--auth=none",
        `--user-data-dir=${path.join(tempDir, "data")}`,
        `--config=${path.join(tempDir, "config.yaml")}`,
      ],
      { detached: true, stdio: ["ignore", "pipe", "pipe", fd] },
    )
    child.stdout?.on("data", (chunk) => (output += chunk))
    child.stderr?.on("data", (chunk) => (output += chunk))
    await new Promise((resolve) => server.close(resolve))

    const exited = new Promise<never>((_, reject) => {
      child?.once("exit", (code) => reject(new Error(`code-server exited with code ${code}:\n${output}`)))
    })
    const status = new Promise<number>((resolve, reject) => {
      http
        .get({ ...target, path: "/healthz" }, (res) => {
          res.resume()
          resolve(res.statusCode ?? 0)
        })
        .once("error", (error) => reject(new Error(`${error.message}:\n${output}`)))
    })
    return Promise.race([status, exited])
  }

  it("should serve requests on a Unix socket passed as a file descriptor", async () => {
    // macOS limits socket paths to 104 bytes, and os.tmpdir() can be too long.
    socketDir = await fs.mkdtemp("/tmp/cs-fd-")
    const server = net.createServer()
    await new Promise<void>((resolve) => server.listen(path.join(socketDir!, "listen.sock"), resolve))
    // server.close() unlinks the socket path, so connect through a hard link.
    const socketPath = path.join(socketDir, "connect.sock")
    await fs.link(path.join(socketDir, "listen.sock"), socketPath)
    expect(await getHealthzThroughFd(server, { socketPath })).toBe(200)
  }, 60000)

  it("should serve requests on a TCP socket passed as a file descriptor", async () => {
    const server = net.createServer()
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
    const { port } = server.address() as net.AddressInfo
    expect(await getHealthzThroughFd(server, { host: "127.0.0.1", port })).toBe(200)
  }, 60000)
})
