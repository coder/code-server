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
  public async handleRequest(route: Route, request: http.IncomingMessage): Promise<HttpResponse> {
    if (this.options.auth !== AuthType.Password || !this.isRoot(route)) {
      throw new HttpError("Not found", HttpCode.NotFound)
    }
    switch (route.base) {
      case "/":
        switch (request.method) {
          case "POST":
            this.ensureMethod(request, ["GET", "POST"])
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

    throw new HttpError("Not found", HttpCode.NotFound)
  }

  public async getRoot(route: Route, error?: Error): Promise<HttpResponse> {
    const response = await this.getUtf8Resource(this.rootPath, "src/browser/pages/login.html")
    response.content = response.content.replace(/{{ERROR}}/, error ? `<div class="error">${error.message}</div>` : "")
    return this.replaceTemplates(route, response)
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

    try {
      const data = await this.getData(request)
      const payload = data ? querystring.parse(data) : {}
      return await this.login(payload, route, request)
    } catch (error) {
      return this.getRoot(route, error)
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
        }),
      )

      throw new Error("Incorrect password")
    }

    throw new Error("Missing password")
  }
}
