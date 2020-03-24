import * as http from "http"
import proxy from "http-proxy"
import * as net from "net"
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
  private readonly proxy = proxy.createProxyServer({})

  /**
   * Domains can be provided in the form `coder.com` or `*.coder.com`. Either
   * way, `<number>.coder.com` will be proxied to `number`.
   */
  public constructor(options: HttpProviderOptions, proxyDomains: string[] = []) {
    super(options)
    this.proxyDomains = proxyDomains.map((d) => d.replace(/^\*\./, "")).filter((d, i, arr) => arr.indexOf(d) === i)
  }

  public async handleRequest(
    route: Route,
    request: http.IncomingMessage,
    response: http.ServerResponse,
  ): Promise<HttpResponse> {
    if (!this.authenticated(request)) {
      // Only redirect from the root. Other requests get an unauthorized error.
      if (route.requestPath && route.requestPath !== "/index.html") {
        throw new HttpError("Unauthorized", HttpCode.Unauthorized)
      }
      return { redirect: "/login", query: { to: route.fullPath } }
    }

    const payload = this.doProxy(route.requestPath, request, response, route.base.replace(/^\//, ""))
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
    this.doProxy(route.requestPath, request, socket, head, route.base.replace(/^\//, ""))
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
    return port ? this.doProxy(route.fullPath, request, response, port) : undefined
  }

  public maybeProxyWebSocket(
    route: Route,
    request: http.IncomingMessage,
    socket: net.Socket,
    head: Buffer,
  ): HttpResponse | undefined {
    const port = this.getPort(request)
    return port ? this.doProxy(route.fullPath, request, socket, head, port) : undefined
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
    path: string,
    request: http.IncomingMessage,
    response: http.ServerResponse,
    portStr: string,
  ): HttpResponse
  private doProxy(
    path: string,
    request: http.IncomingMessage,
    socket: net.Socket,
    head: Buffer,
    portStr: string,
  ): HttpResponse
  private doProxy(
    path: string,
    request: http.IncomingMessage,
    responseOrSocket: http.ServerResponse | net.Socket,
    headOrPortStr: Buffer | string,
    portStr?: string,
  ): HttpResponse {
    const _portStr = typeof headOrPortStr === "string" ? headOrPortStr : portStr
    if (!_portStr) {
      return {
        code: HttpCode.BadRequest,
        content: "Port must be provided",
      }
    }

    const port = parseInt(_portStr, 10)
    if (isNaN(port)) {
      return {
        code: HttpCode.BadRequest,
        content: `"${_portStr}" is not a valid number`,
      }
    }

    const options: proxy.ServerOptions = {
      autoRewrite: true,
      changeOrigin: true,
      ignorePath: true,
      target: `http://127.0.0.1:${port}${path}`,
    }

    if (responseOrSocket instanceof net.Socket) {
      this.proxy.ws(request, responseOrSocket, headOrPortStr, options)
    } else {
      this.proxy.web(request, responseOrSocket, options)
    }

    return { handled: true }
  }
}
