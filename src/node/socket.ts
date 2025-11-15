import { promises as fs } from "fs"
import * as net from "net"
import * as path from "path"
import * as stream from "stream"
import * as tls from "tls"
import { Emitter } from "../common/emitter"
import { generateUuid } from "../common/util"
import { canConnect, paths } from "./util"

/**
 * Provides a way to proxy a TLS socket. Can be used when you need to pass a
 * socket to a child process since you can't pass the TLS socket.
 */
export class SocketProxyProvider {
  private readonly onProxyConnect = new Emitter<net.Socket>()
  private proxyPipe = path.join(paths.runtime, "tls-proxy")
  private _proxyServer?: Promise<net.Server>
  private readonly proxyTimeout = 5000

  /**
   * Stop the proxy server.
   */
  public stop(): void {
    if (this._proxyServer) {
      this._proxyServer.then((server) => server.close())
      this._proxyServer = undefined
    }
  }

  /**
   * Create a socket proxy for TLS sockets. If it is not a TLS socket the
   * original socket or stream is returned. This will spawn a proxy server on
   * demand.
   */
  public async createProxy(socket: tls.TLSSocket | net.Socket): Promise<net.Socket>
  public async createProxy(socket: stream.Duplex): Promise<stream.Duplex>
  public async createProxy(socket: tls.TLSSocket | net.Socket | stream.Duplex): Promise<net.Socket | stream.Duplex> {
    if (!(socket instanceof tls.TLSSocket)) {
      return socket
    }

    await this.startProxyServer()

    return new Promise((resolve, reject) => {
      const id = generateUuid()
      const proxy = net.connect(this.proxyPipe)
      proxy.once("connect", () => proxy.write(id))

      const timeout = setTimeout(() => {
        listener.dispose()
        socket.destroy()
        proxy.destroy()
        reject(new Error("TLS socket proxy timed out"))
      }, this.proxyTimeout)

      const listener = this.onProxyConnect.event((connection) => {
        connection.once("data", (data) => {
          if (!socket.destroyed && !proxy.destroyed && data.toString() === id) {
            clearTimeout(timeout)
            listener.dispose()
            ;[
              [proxy, socket],
              [socket, proxy],
            ].forEach(([a, b]) => {
              a.pipe(b)
              a.on("error", () => b.destroy())
              a.on("close", () => b.destroy())
              a.on("end", () => b.end())
            })
            resolve(connection)
          }
        })
      })
    })
  }

  private async startProxyServer(): Promise<net.Server> {
    if (!this._proxyServer) {
      this._proxyServer = this.findFreeSocketPath(this.proxyPipe)
        .then((pipe) => {
          this.proxyPipe = pipe
          return Promise.all([
            fs.mkdir(path.dirname(this.proxyPipe), { recursive: true }),
            fs.rm(this.proxyPipe, { force: true, recursive: true }),
          ])
        })
        .then(() => {
          return new Promise((resolve) => {
            const proxyServer = net.createServer((p) => this.onProxyConnect.emit(p))
            proxyServer.once("listening", () => resolve(proxyServer))
            proxyServer.listen(this.proxyPipe)
          })
        })
    }
    return this._proxyServer
  }

  public async findFreeSocketPath(basePath: string, maxTries = 100): Promise<string> {
    let i = 0
    let path = basePath
    while ((await canConnect(path)) && i < maxTries) {
      path = `${basePath}-${++i}`
    }
    return path
  }
}
