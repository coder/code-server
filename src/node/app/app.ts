import * as http from "http"
import { HttpCode, HttpError } from "../../common/http"
import { HttpProvider, HttpProviderOptions, HttpResponse, Route } from "../http"
import { ApiHttpProvider } from "./api"

/**
 * App/fallback HTTP provider.
 */
export class AppHttpProvider extends HttpProvider {
  public constructor(options: HttpProviderOptions, private readonly api: ApiHttpProvider) {
    super(options)
  }

  public async handleRequest(route: Route, request: http.IncomingMessage): Promise<HttpResponse> {
    if (!this.authenticated(request)) {
      return { redirect: "/login", query: { to: route.fullPath } }
    }

    this.ensureMethod(request)
    if (route.requestPath !== "/index.html") {
      throw new HttpError("Not found", HttpCode.NotFound)
    }

    // Run an existing app, but if it doesn't exist go ahead and start it.
    let app = this.api.getRunningApplication(route.base)
    let sessionId = app && app.sessionId
    if (!app) {
      app = (await this.api.installedApplications()).find((a) => a.path === route.base)
      if (app && app.exec) {
        sessionId = await this.api.createSession(app)
      }
    }

    if (sessionId) {
      return this.getAppRoot(route, (app && app.name) || "", sessionId)
    }

    throw new HttpError("Application not found", HttpCode.NotFound)
  }

  public async getAppRoot(route: Route, name: string, sessionId: string): Promise<HttpResponse> {
    const response = await this.getUtf8Resource(this.rootPath, "src/browser/pages/app.html")
    response.content = response.content.replace(/{{APP_NAME}}/, name)
    return this.replaceTemplates(route, response, sessionId)
  }
}
