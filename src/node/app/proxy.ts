import * as http from "http"
import { HttpCode, HttpError } from "../../common/http"
import { HttpProvider, HttpResponse, Route, WsResponse } from "../http"

/**
 * Proxy HTTP provider.
 */
export class ProxyHttpProvider extends HttpProvider {
  public async handleRequest(route: Route, request: http.IncomingMessage): Promise<HttpResponse> {
    if (!this.authenticated(request)) {
      if (this.isRoot(route)) {
        return { redirect: "/login", query: { to: route.fullPath } }
      }
      throw new HttpError("Unauthorized", HttpCode.Unauthorized)
    }

    // Ensure there is a trailing slash so relative paths work correctly.
    if (this.isRoot(route) && !route.fullPath.endsWith("/")) {
      return {
        redirect: `${route.fullPath}/`,
      }
    }

    const port = route.base.replace(/^\//, "")
    return {
      proxy: {
        strip: `${route.providerBase}/${port}`,
        port,
      },
    }
  }

  public async handleWebSocket(route: Route, request: http.IncomingMessage): Promise<WsResponse> {
    this.ensureAuthenticated(request)
    const port = route.base.replace(/^\//, "")
    return {
      proxy: {
        strip: `${route.providerBase}/${port}`,
        port,
      },
    }
  }
}
