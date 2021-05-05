import { logger } from "@coder/logger"
import * as express from "express"
import * as http from "http"
import * as net from "net"
import * as nodeFetch from "node-fetch"
import Websocket from "ws"
import * as util from "../../src/common/util"
import { ensureAddress } from "../../src/node/app"
import { handleUpgrade } from "../../src/node/wsRouter"

// Perhaps an abstraction similar to this should be used in app.ts as well.
export class HttpServer {
  private readonly sockets = new Set<net.Socket>()
  private cleanupTimeout?: NodeJS.Timeout

  // See usage in test/integration.ts
  public constructor(private readonly hs = http.createServer()) {
    this.hs.on("connection", (socket) => {
      this.sockets.add(socket)
      socket.on("close", () => {
        this.sockets.delete(socket)
        if (this.cleanupTimeout && this.sockets.size === 0) {
          clearTimeout(this.cleanupTimeout)
          this.cleanupTimeout = undefined
        }
      })
    })
  }

  /**
   * listen starts the server on a random localhost port.
   * Use close to cleanup when done.
   */
  public listen(fn: http.RequestListener): Promise<void> {
    this.hs.on("request", fn)

    let resolved = false
    return new Promise((res, rej) => {
      this.hs.listen(0, "localhost", () => {
        res()
        resolved = true
      })

      this.hs.on("error", (err) => {
        if (!resolved) {
          rej(err)
        } else {
          // Promise resolved earlier so this is some other error.
          util.logError(logger, "http server error", err)
        }
      })
    })
  }

  /**
   * Send upgrade requests to an Express app.
   */
  public listenUpgrade(app: express.Express): void {
    handleUpgrade(app, this.hs)
  }

  /**
   * close cleans up the server.
   */
  public close(): Promise<void> {
    return new Promise((res, rej) => {
      // Close will not actually close anything; it just waits until everything
      // is closed.
      this.hs.close((err) => {
        if (err) {
          rej(err)
          return
        }
        res()
      })

      // If there are sockets remaining we might need to force close them or
      // this promise might never resolve.
      if (this.sockets.size > 0) {
        // Give sockets a chance to close up shop.
        this.cleanupTimeout = setTimeout(() => {
          this.cleanupTimeout = undefined
          for (const socket of this.sockets.values()) {
            console.warn("a socket was left hanging")
            socket.destroy()
          }
        }, 1000)
      }
    })
  }

  /**
   * fetch fetches the request path.
   * The request path must be rooted!
   */
  public fetch(requestPath: string, opts?: nodeFetch.RequestInit): Promise<nodeFetch.Response> {
    return nodeFetch.default(`${ensureAddress(this.hs)}${requestPath}`, opts)
  }

  /**
   * Open a websocket against the requset path.
   */
  public ws(requestPath: string): Websocket {
    return new Websocket(`${ensureAddress(this.hs).replace("http:", "ws:")}${requestPath}`)
  }

  public port(): number {
    const addr = this.hs.address()
    if (addr && typeof addr === "object") {
      return addr.port
    }
    throw new Error("server not listening or listening on unix socket")
  }
}
