import { logger } from "@coder/logger"
import * as http from "http"
import proxy from "http-proxy"
import * as net from "net"
import * as querystring from "querystring"
import { HttpCode, HttpError } from "../../common/http"
import { HttpProvider, HttpProviderOptions, HttpProxyProvider, HttpResponse, Route } from "../http"

interface Request extends http.IncomingMessage {
  base?: string
}

/**
 * Proxy HTTP provider.
 */
export class ProxyHttpProvider extends HttpProvider implements HttpProxyProvider {
  /**
   * Proxy domains are stored here without the leading `*.`
   */
  public readonly proxyDomains: string[]
  private readonly proxy = proxy.createProxyServer({})

  /**
   * Domains can be provided in the form `coder.com` or `*.coder.com`. Either
   * way, `<number>.coder.com` will be proxied to `number`.
   */
  public constructor(options: HttpProviderOptions, proxyDomains: string[] = []) {
    super(options)
    this.proxyDomains = proxyDomains.map((d) => d.replace(/^\*\./, "")).filter((d, i, arr) => arr.indexOf(d) === i)
    this.proxy.on("error", (error) => logger.warn(error.message))
    // Intercept the response to rewrite absolute redirects against the base path.
    this.proxy.on("proxyRes", (response, request: Request) => {
      if (response.headers.location && response.headers.location.startsWith("/") && request.base) {
        response.headers.location = request.base + response.headers.location
      }
    })
  }

  public async handleRequest(
    route: Route,
    request: http.IncomingMessage,
    response: http.ServerResponse,
  ): Promise<HttpResponse> {
    if (!this.authenticated(request)) {
      if (this.isRoot(route)) {
        return { redirect: "/login", query: { to: route.fullPath } }
      }
      throw new HttpError("Unauthorized", HttpCode.Unauthorized)
    }

    // Ensure there is a trailing slash so relative paths work correctly.
    const port = route.base.replace(/^\//, "")
    const base = `${this.options.base}/${port}`
    if (this.isRoot(route) && !route.fullPath.endsWith("/")) {
      return {
        redirect: `${base}/`,
      }
    }

    const payload = this.doProxy(route, request, response, port, base)
    if (payload) {
      return payload
    }

    throw new HttpError("Not found", HttpCode.NotFound)
  }

  public async handleWebSocket(
    route: Route,
    request: http.IncomingMessage,
    socket: net.Socket,
    head: Buffer,
  ): Promise<void> {
    this.ensureAuthenticated(request)
    const port = route.base.replace(/^\//, "")
    const base = `${this.options.base}/${port}`
    this.doProxy(route, request, { socket, head }, port, base)
  }

  public getCookieDomain(host: string): string {
    let current: string | undefined
    this.proxyDomains.forEach((domain) => {
      if (host.endsWith(domain) && (!current || domain.length < current.length)) {
        current = domain
      }
    })
    // Setting the domain to localhost doesn't seem to work for subdomains (for
    // example dev.localhost).
    return current && current !== "localhost" ? current : host
  }

  public maybeProxyRequest(
    route: Route,
    request: http.IncomingMessage,
    response: http.ServerResponse,
  ): HttpResponse | undefined {
    const port = this.getPort(request)
    return port ? this.doProxy(route, request, response, port) : undefined
  }

  public maybeProxyWebSocket(
    route: Route,
    request: http.IncomingMessage,
    socket: net.Socket,
    head: Buffer,
  ): HttpResponse | undefined {
    const port = this.getPort(request)
    return port ? this.doProxy(route, request, { socket, head }, port) : undefined
  }

  private getPort(request: http.IncomingMessage): string | undefined {
    // No proxy until we're authenticated. This will cause the login page to
    // show as well as let our assets keep loading normally.
    if (!this.authenticated(request)) {
      return undefined
    }

    // Split into parts.
    const host = request.headers.host || ""
    const idx = host.indexOf(":")
    const domain = idx !== -1 ? host.substring(0, idx) : host
    const parts = domain.split(".")

    // There must be an exact match.
    const port = parts.shift()
    const proxyDomain = parts.join(".")
    if (!port || !this.proxyDomains.includes(proxyDomain)) {
      return undefined
    }

    return port
  }

  private doProxy(
    route: Route,
    request: http.IncomingMessage,
    response: http.ServerResponse,
    portStr: string,
    base?: string,
  ): HttpResponse
  private doProxy(
    route: Route,
    request: http.IncomingMessage,
    response: { socket: net.Socket; head: Buffer },
    portStr: string,
    base?: string,
  ): HttpResponse
  private doProxy(
    route: Route,
    request: http.IncomingMessage,
    response: http.ServerResponse | { socket: net.Socket; head: Buffer },
    portStr: string,
    base?: string,
  ): HttpResponse {
    const port = parseInt(portStr, 10)
    if (isNaN(port)) {
      return {
        code: HttpCode.BadRequest,
        content: `"${portStr}" is not a valid number`,
      }
    }

    // REVIEW: Absolute redirects need to be based on the subpath but I'm not
    // sure how best to get this information to the `proxyRes` event handler.
    // For now I'm sticking it on the request object which is passed through to
    // the event.
    ;(request as Request).base = base

    const isHttp = response instanceof http.ServerResponse
    const path = base ? route.fullPath.replace(base, "") : route.fullPath
    const options: proxy.ServerOptions = {
      changeOrigin: true,
      ignorePath: true,
      target: `${isHttp ? "http" : "ws"}://127.0.0.1:${port}${path}${
        Object.keys(route.query).length > 0 ? `?${querystring.stringify(route.query)}` : ""
      }`,
      ws: !isHttp,
    }

    if (response instanceof http.ServerResponse) {
      this.proxy.web(request, response, options)
    } else {
      this.proxy.ws(request, response.socket, response.head, options)
    }

    return { handled: true }
  }
}
