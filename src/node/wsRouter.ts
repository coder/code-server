import * as express from "express"
import * as expressCore from "express-serve-static-core"
import * as http from "http"
import Websocket from "ws"
import * as pluginapi from "../../typings/pluginapi"

export const handleUpgrade = (app: express.Express, server: http.Server): void => {
  server.on("upgrade", (req, socket, head) => {
    socket.pause()

    const wreq = req as InternalWebsocketRequest
    wreq.ws = socket
    wreq.head = head
    wreq._ws_handled = false

    // Send the request off to be handled by Express.
    ;(app as any).handle(wreq, new http.ServerResponse(wreq), () => {
      if (!wreq._ws_handled) {
        socket.end("HTTP/1.1 404 Not Found\r\n\r\n")
      }
    })
  })
}

interface InternalWebsocketRequest extends pluginapi.WebsocketRequest {
  _ws_handled: boolean
}

export class WebsocketRouter {
  public readonly router = express.Router()

  /**
   * Handle a websocket at this route. Note that websockets are immediately
   * paused when they come in.
   *
   * If the origin header exists it must match the host or the connection will
   * be prevented.
   */
  public ws(route: expressCore.PathParams, ...handlers: pluginapi.WebSocketHandler[]): void {
    this.router.get(
      route,
      ...handlers.map((handler) => {
        const wrapped: express.Handler = (req, res, next) => {
          ;(req as InternalWebsocketRequest)._ws_handled = true
          return handler(req as pluginapi.WebsocketRequest, res, next)
        }
        return wrapped
      }),
    )
  }
}

export function Router(): WebsocketRouter {
  return new WebsocketRouter()
}

export const wss = new Websocket.Server({ noServer: true })
