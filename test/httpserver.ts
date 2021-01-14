import * as http from "http"
import * as nodeFetch from "node-fetch"
import * as util from "../src/common/util"
import { ensureAddress } from "../src/node/app"

// Perhaps an abstraction similar to this should be used in app.ts as well.
export class HttpServer {
  private hs = http.createServer()

  public constructor(hs?: http.Server) {
    // See usage in test/integration.ts
    if (hs) {
      this.hs = hs
    }
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
          util.logError("http server error", err)
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

  public port(): number {
    const addr = this.hs.address()
    if (addr && typeof addr == "object") {
      return addr.port
    }
    throw new Error("server not listening or listening on unix socket")
  }
}
