import * as http from "http"
import { logger } from "@coder/logger"
import { ensureAddress } from "../src/node/app"
import * as nodeFetch from "node-fetch"

export class HttpServer {
  private hs = http.createServer()

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
          logError("server error", err)
        }
      })
    })
  }

  /**
   * close cleans up the server.
   */
  public close(): Promise<void> {
    return new Promise((res, rej) => {
      this.hs.close((err) => {
        if (err) {
          rej(err)
          return
        }
        res()
      })
    })
  }

  /**
   * fetch fetches the request path.
   * The request path must be rooted!
   */
  public fetch(requestPath: string, opts?: nodeFetch.RequestInit): Promise<nodeFetch.Response> {
    return nodeFetch.default(`${ensureAddress(this.hs)}${requestPath}`, opts)
  }
}


export function logError(prefix: string, err: any): void {
  if (err instanceof Error) {
    logger.error(`${prefix}: ${err.message} ${err.stack}`)
  } else {
    logger.error(`${prefix}: ${err}`)
  }
}
