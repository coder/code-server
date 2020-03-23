import * as http from "http"
import { HttpCode, HttpError } from "../../common/http"
import { HttpProvider, HttpProviderOptions, HttpProxyProvider, HttpResponse, Route } from "../http"

/**
 * Proxy HTTP provider.
 */
export class ProxyHttpProvider extends HttpProvider implements HttpProxyProvider {
  public readonly proxyDomains: string[]

  public constructor(options: HttpProviderOptions, proxyDomains: string[] = []) {
    super(options)
    this.proxyDomains = proxyDomains.map((d) => d.replace(/^\*\./, "")).filter((d, i, arr) => arr.indexOf(d) === i)
  }

  public async handleRequest(route: Route, request: http.IncomingMessage): Promise<HttpResponse> {
    if (!this.authenticated(request)) {
      if (route.requestPath === "/index.html") {
        return { redirect: "/login", query: { to: route.fullPath } }
      }
      throw new HttpError("Unauthorized", HttpCode.Unauthorized)
    }

    const payload = this.proxy(route.base.replace(/^\//, ""))
    if (payload) {
      return payload
    }

    throw new HttpError("Not found", HttpCode.NotFound)
  }

  public getProxyDomain(host?: string): string | undefined {
    if (!host || !this.proxyDomains) {
      return undefined
    }

    return this.proxyDomains.find((d) => host.endsWith(d))
  }

  public maybeProxy(request: http.IncomingMessage): HttpResponse | undefined {
    // No proxy until we're authenticated. This will cause the login page to
    // show as well as let our assets keep loading normally.
    if (!this.authenticated(request)) {
      return undefined
    }

    const host = request.headers.host
    const proxyDomain = this.getProxyDomain(host)
    if (!host || !proxyDomain) {
      return undefined
    }

    const proxyDomainLength = proxyDomain.split(".").length
    const portStr = host
      .split(".")
      .slice(0, -proxyDomainLength)
      .pop()

    if (!portStr) {
      return undefined
    }

    return this.proxy(portStr)
  }

  private proxy(portStr: string): HttpResponse {
    if (!portStr) {
      return {
        code: HttpCode.BadRequest,
        content: "Port must be provided",
      }
    }
    const port = parseInt(portStr, 10)
    if (isNaN(port)) {
      return {
        code: HttpCode.BadRequest,
        content: `"${portStr}" is not a valid number`,
      }
    }
    return {
      code: HttpCode.Ok,
      content: `will proxy this to ${port}`,
    }
  }
}
