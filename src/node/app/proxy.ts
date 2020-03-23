import * as http from "http"
import { HttpCode, HttpError } from "../../common/http"
import { HttpProvider, HttpProviderOptions, HttpProxyProvider, HttpResponse, Route } from "../http"

/**
 * Proxy HTTP provider.
 */
export class ProxyHttpProvider extends HttpProvider implements HttpProxyProvider {
  /**
   * Proxy domains are stored here without the leading `*.`
   */
  public readonly proxyDomains: string[]

  /**
   * Domains can be provided in the form `coder.com` or `*.coder.com`. Either
   * way, `<number>.coder.com` will be proxied to `number`.
   */
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

  public getCookieDomain(host: string): string {
    let current: string | undefined
    this.proxyDomains.forEach((domain) => {
      if (host.endsWith(domain) && (!current || domain.length < current.length)) {
        current = domain
      }
    })
    return current || host
  }

  public maybeProxy(request: http.IncomingMessage): HttpResponse | undefined {
    // No proxy until we're authenticated. This will cause the login page to
    // show as well as let our assets keep loading normally.
    if (!this.authenticated(request)) {
      return undefined
    }

    // At minimum there needs to be sub.domain.tld.
    const host = request.headers.host
    const parts = host && host.split(".")
    if (!parts || parts.length < 3) {
      return undefined
    }

    // There must be an exact match.
    const port = parts.shift()
    const proxyDomain = parts.join(".")
    if (!port || !this.proxyDomains.includes(proxyDomain)) {
      return undefined
    }

    return this.proxy(port)
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
