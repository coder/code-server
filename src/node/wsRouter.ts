import * as express from "express"
import * as expressCore from "express-serve-static-core"
import * as http from "http"
import * as net from "net"

export const handleUpgrade = (app: express.Express, server: http.Server): void => {
  server.on("upgrade", (req, socket, head) => {
    socket.pause()

    req.ws = socket
    req.head = head
    req._ws_handled = false

    // Send the request off to be handled by Express.
    ;(app as any).handle(req, new http.ServerResponse(req), () => {
      if (!req._ws_handled) {
        socket.end("HTTP/1.1 404 Not Found\r\n\r\n")
      }
    })
  })
}

export interface WebsocketRequest extends express.Request {
  ws: net.Socket
  head: Buffer
}

interface InternalWebsocketRequest extends WebsocketRequest {
  _ws_handled: boolean
}

export type WebSocketHandler = (
  req: WebsocketRequest,
  res: express.Response,
  next: express.NextFunction,
) => void | Promise<void>

export class WebsocketRouter {
  public readonly router = express.Router()

  public ws(route: expressCore.PathParams, ...handlers: WebSocketHandler[]): void {
    this.router.get(
      route,
      ...handlers.map((handler) => {
        const wrapped: express.Handler = (req, res, next) => {
          ;(req as InternalWebsocketRequest)._ws_handled = true
          return handler(req as WebsocketRequest, res, next)
        }
        return wrapped
      }),
    )
  }
}

export function Router(): WebsocketRouter {
  return new WebsocketRouter()
}
