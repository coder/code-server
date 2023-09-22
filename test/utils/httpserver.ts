import { logger } from "@coder/logger"
import * as express from "express"
import * as http from "http"
import nodeFetch, { RequestInit, Response } from "node-fetch"
import Websocket from "ws"
import { Disposable } from "../../src/common/emitter"
import * as util from "../../src/common/util"
import { ensureAddress } from "../../src/node/app"
import { disposer } from "../../src/node/http"
import { handleUpgrade } from "../../src/node/wsRouter"

// Perhaps an abstraction similar to this should be used in app.ts as well.
export class HttpServer {
  private hs: http.Server
  public dispose: Disposable["dispose"]

  /**
   * Expects a server and a disposal that cleans up the server (and anything
   * else that may need cleanup).
   *
   * Otherwise a new server is created.
   */
  public constructor(server?: { server: http.Server; dispose: Disposable["dispose"] }) {
    this.hs = server?.server || http.createServer()
    this.dispose = server?.dispose || disposer(this.hs)
  }

  /**
   * listen starts the server on a random localhost port.
   * Use close to cleanup when done.
   */
  public listen(fn: http.RequestListener): Promise<void> {
    this.hs.on("request", fn)

    return new Promise((resolve, reject) => {
      this.hs.on("error", reject)

      this.hs.listen(0, "127.0.0.1", () => {
        this.hs.off("error", reject)
        resolve()

        this.hs.on("error", (err) => {
          // Promise resolved earlier so this is some other error.
          util.logError(logger, "http server error", err)
        })
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
   * fetch fetches the request path.
   * The request path must be rooted!
   */
  public fetch(requestPath: string, opts?: RequestInit, query?: { [key: string]: string }): Promise<Response> {
    const address = ensureAddress(this.hs, "http")
    if (typeof address === "string") {
      throw new Error("Cannot fetch socket path")
    }
    address.pathname = requestPath
    if (query) {
      Object.keys(query).forEach((key) => {
        address.searchParams.append(key, query[key])
      })
    }
    return nodeFetch(address.toString(), opts)
  }

  /**
   * Open a websocket against the request path.
   */
  public ws(requestPath: string, options?: Websocket.ClientOptions): Websocket {
    const address = ensureAddress(this.hs, "ws")
    if (typeof address === "string") {
      throw new Error("Cannot open websocket to socket path")
    }
    address.pathname = requestPath

    return new Websocket(address.toString(), options)
  }

  /**
   * Open a websocket and wait for it to fully open.
   */
  public wsWait(requestPath: string, options?: Websocket.ClientOptions): Promise<Websocket> {
    const ws = this.ws(requestPath, options)
    return new Promise<Websocket>((resolve, reject) => {
      ws.on("error", (err) => reject(err))
      ws.on("open", () => resolve(ws))
    })
  }

  public port(): number {
    const addr = this.hs.address()
    if (addr && typeof addr === "object") {
      return addr.port
    }
    throw new Error("server not listening or listening on unix socket")
  }
}
