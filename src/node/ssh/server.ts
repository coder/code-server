import * as http from "http"
import * as net from "net"
import * as ssh from "ssh2"
import * as ws from "ws"
import * as fs from "fs"
import { logger } from "@coder/logger"
import safeCompare from "safe-compare"
import { HttpProvider, HttpResponse, HttpProviderOptions, Route } from "../http"
import { HttpCode } from "../../common/http"
import { forwardSshPort, fillSshSession } from "./ssh"
import { hash } from "../util"

export class SshProvider extends HttpProvider {
  private readonly wss = new ws.Server({ noServer: true })
  private sshServer: ssh.Server

  public constructor(options: HttpProviderOptions, hostKeyPath: string) {
    super(options)
    const hostKey = fs.readFileSync(hostKeyPath)
    this.sshServer = new ssh.Server({ hostKeys: [hostKey] }, this.handleSsh)

    this.sshServer.on("error", (err) => {
      logger.trace(`SSH server error: ${err.stack}`)
    })
  }

  public async listen(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.sshServer.once("error", reject)
      this.sshServer.listen(() => {
        resolve(this.sshServer.address().port)
      })
    })
  }

  public async handleRequest(): Promise<HttpResponse> {
    // SSH has no HTTP endpoints
    return { code: HttpCode.NotFound }
  }

  public handleWebSocket(
    _route: Route,
    request: http.IncomingMessage,
    socket: net.Socket,
    head: Buffer,
  ): Promise<void> {
    // Create a fake websocket to the sshServer
    const sshSocket = net.connect(this.sshServer.address().port, "localhost")

    return new Promise((resolve) => {
      this.wss.handleUpgrade(request, socket, head, (ws) => {
        // Send SSH data to WS as compressed binary
        sshSocket.on("data", (data) => {
          ws.send(data, {
            binary: true,
            compress: true,
            fin: true,
          })
        })

        // Send WS data to SSH as buffer
        ws.on("message", (msg) => {
          // Buffer.from is cool with all types, but casting as string keeps typing simple
          sshSocket.write(Buffer.from(msg as string))
        })

        ws.on("error", (err) => {
          logger.error(`SSH websocket error: ${err.stack}`)
        })

        resolve()
      })
    })
  }

  /**
   * Determine how to handle incoming SSH connections.
   */
  private handleSsh = (client: ssh.Connection, info: ssh.ClientInfo): void => {
    logger.debug(`Incoming SSH connection from ${info.ip}`)
    client.on("authentication", (ctx) => {
      // Allow any auth to go through if we have no password
      if (!this.options.password) {
        return ctx.accept()
      }

      // Otherwise require the same password as code-server
      if (ctx.method === "password") {
        if (
          safeCompare(this.options.password, hash(ctx.password)) ||
          safeCompare(this.options.password, ctx.password)
        ) {
          return ctx.accept()
        }
      }

      // Reject, letting them know that password is the only method we allow
      ctx.reject(["password"])
    })
    client.on("tcpip", forwardSshPort)
    client.on("session", fillSshSession)
    client.on("error", (err) => {
      // Don't bother logging Keepalive errors, they probably just disconnected
      if (err.message === "Keepalive timeout") {
        return logger.debug("SSH client keepalive timeout")
      }
      logger.error(`SSH client error: ${err.stack}`)
    })
  }
}
