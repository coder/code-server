import * as http from "http"
import * as limiter from "limiter"
import * as querystring from "querystring"
import { HttpCode, HttpError } from "../../common/http"
import { AuthType } from "../cli"
import { HttpProvider, HttpProviderOptions, HttpResponse, Route } from "../http"
import { hash, humanPath } from "../util"

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
  public constructor(
    options: HttpProviderOptions,
    private readonly configFile: string,
    private readonly envPassword: boolean,
  ) {
    super(options)
  }

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
    let passwordMsg = `Check the config file at ${humanPath(this.configFile)} for the password.`
    if (this.envPassword) {
      passwordMsg = "Password was set from $PASSWORD."
    }
    response.content = response.content.replace(/{{PASSWORD_MSG}}/g, passwordMsg)
    return this.replaceTemplates(route, response)
  }

  private readonly limiter = new RateLimiter()

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
      if (!this.limiter.try()) {
        throw new Error("Login rate limited!")
      }

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

// RateLimiter wraps around the limiter library for logins.
// It allows 2 logins every minute and 12 logins every hour.
class RateLimiter {
  private readonly minuteLimiter = new limiter.RateLimiter(2, "minute")
  private readonly hourLimiter = new limiter.RateLimiter(12, "hour")

  public try(): boolean {
    if (this.minuteLimiter.tryRemoveTokens(1)) {
      return true
    }
    return this.hourLimiter.tryRemoveTokens(1)
  }
}
