import * as http from "http"
import { HttpCode, HttpError } from "../../common/http"
import { AuthType, HttpProvider, HttpProviderOptions, HttpResponse, Route } from "../http"

/**
 * Proxy HTTP provider.
 */
export class ProxyHttpProvider extends HttpProvider {
  public constructor(options: HttpProviderOptions, private readonly proxyDomains: string[]) {
    super(options)
  }

  public async handleRequest(route: Route): Promise<HttpResponse> {
    if (this.options.auth !== AuthType.Password || route.requestPath !== "/index.html") {
      throw new HttpError("Not found", HttpCode.NotFound)
    }
    const payload = this.proxy(route.base.replace(/^\//, ""))
    if (!payload) {
      throw new HttpError("Not found", HttpCode.NotFound)
    }
    return payload
  }

  public async getRoot(route: Route, error?: Error): Promise<HttpResponse> {
    const response = await this.getUtf8Resource(this.rootPath, "src/browser/pages/login.html")
    response.content = response.content.replace(/{{ERROR}}/, error ? `<div class="error">${error.message}</div>` : "")
    return this.replaceTemplates(route, response)
  }

  /**
   * Return a response if the request should be proxied. Anything that ends in a
   * proxy domain and has a subdomain should be proxied. The port is found in
   * the top-most subdomain.
   *
   * For example, if the proxy domain is `coder.com` then `8080.coder.com` and
   * `test.8080.coder.com` will both proxy to `8080` but `8080.test.coder.com`
   * will have an error because `test` isn't a port. If the proxy domain was
   * `test.coder.com` then it would work.
   */
  public maybeProxy(request: http.IncomingMessage): HttpResponse | undefined {
    const host = request.headers.host
    if (!host || !this.proxyDomains) {
      return undefined
    }

    const proxyDomain = this.proxyDomains.find((d) => host.endsWith(d))
    if (!proxyDomain) {
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
