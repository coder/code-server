import * as http from "http"
import * as querystring from "querystring"
import { HttpCode, HttpError } from "../../common/http"
import { AuthType, HttpProvider, HttpResponse, Route } from "../http"
import { hash } from "../util"

interface LoginPayload {
  password?: string
  /**
   * Since we must set a cookie with an absolute path, we need to know the full
   * base path.
   */
  base?: string
}

/**
 * Login HTTP provider.
 */
export class LoginHttpProvider extends HttpProvider {
  public async handleRequest(route: Route, request: http.IncomingMessage): Promise<HttpResponse | undefined> {
    if (this.options.auth !== AuthType.Password) {
      throw new HttpError("Not found", HttpCode.NotFound)
    }
    switch (route.base) {
      case "/":
        if (route.requestPath !== "/index.html") {
          throw new HttpError("Not found", HttpCode.NotFound)
        }

        switch (request.method) {
          case "POST":
            return this.tryLogin(route, request)
          default:
            this.ensureMethod(request)
            if (this.authenticated(request)) {
              return {
                redirect: (Array.isArray(route.query.to) ? route.query.to[0] : route.query.to) || "/",
                query: { to: undefined },
              }
            }
            return this.getRoot(route)
        }
    }

    return undefined
  }

  public async getRoot(route: Route, value?: string, error?: Error): Promise<HttpResponse> {
    const response = await this.getUtf8Resource(this.rootPath, "src/browser/pages/login.html")
    response.content = response.content
      .replace(/{{COMMIT}}/g, this.options.commit)
      .replace(/{{BASE}}/g, this.base(route))
      .replace(/{{VALUE}}/, value || "")
      .replace(/{{ERROR}}/, error ? `<div class="error">${error.message}</div>` : "")
    return response
  }

  /**
   * Try logging in. On failure, show the login page with an error.
   */
  private async tryLogin(route: Route, request: http.IncomingMessage): Promise<HttpResponse> {
    // Already authenticated via cookies?
    const providedPassword = this.authenticated(request)
    if (providedPassword) {
      return { code: HttpCode.Ok }
    }

    let payload: LoginPayload | undefined
    try {
      const data = await this.getData(request)
      const p = data ? querystring.parse(data) : {}
      payload = p

      return await this.login(p, route, request)
    } catch (error) {
      return this.getRoot(route, payload ? payload.password : undefined, error)
    }
  }

  /**
   * Return a cookie if the user is authenticated otherwise throw an error.
   */
  private async login(payload: LoginPayload, route: Route, request: http.IncomingMessage): Promise<HttpResponse> {
    const password = this.authenticated(request, {
      key: typeof payload.password === "string" ? [hash(payload.password)] : undefined,
    })

    if (password) {
      return {
        redirect: (Array.isArray(route.query.to) ? route.query.to[0] : route.query.to) || "/",
        query: { to: undefined },
        cookie:
          typeof password === "string"
            ? {
                key: "key",
                value: password,
                path: payload.base,
              }
            : undefined,
      }
    }

    // Only log if it was an actual login attempt.
    if (payload && payload.password) {
      console.error(
        "Failed login attempt",
        JSON.stringify({
          xForwardedFor: request.headers["x-forwarded-for"],
          remoteAddress: request.connection.remoteAddress,
          userAgent: request.headers["user-agent"],
          timestamp: Math.floor(new Date().getTime() / 1000),
        })
      )

      throw new Error("Incorrect password")
    }

    throw new Error("Missing password")
  }

  public async handleWebSocket(): Promise<undefined> {
    return undefined
  }
}
