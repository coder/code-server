import { logger } from "@coder/logger"
import * as http from "http"
import * as querystring from "querystring"
import { Application } from "../../common/api"
import { HttpCode, HttpError } from "../../common/http"
import { Options } from "../../common/util"
import { HttpProvider, HttpProviderOptions, HttpResponse, Route } from "../http"
import { ApiHttpProvider } from "./api"
import { UpdateHttpProvider } from "./update"

/**
 * Top-level and fallback HTTP provider.
 */
export class MainHttpProvider extends HttpProvider {
  public constructor(
    options: HttpProviderOptions,
    private readonly api: ApiHttpProvider,
    private readonly update: UpdateHttpProvider
  ) {
    super(options)
  }

  public async handleRequest(route: Route, request: http.IncomingMessage): Promise<HttpResponse | undefined> {
    switch (route.base) {
      case "/static": {
        this.ensureMethod(request)
        const response = await this.getReplacedResource(route)
        if (!this.isDev) {
          response.cache = true
        }
        return response
      }

      case "/delete": {
        this.ensureMethod(request, "POST")
        const data = await this.getData(request)
        const p = data ? querystring.parse(data) : {}
        this.api.deleteSession(p.sessionId as string)
        return { redirect: "/" }
      }

      case "/": {
        this.ensureMethod(request)
        if (route.requestPath !== "/index.html") {
          throw new HttpError("Not found", HttpCode.NotFound)
        } else if (!this.authenticated(request)) {
          return { redirect: "/login" }
        }
        return this.getRoot(route)
      }
    }

    // Run an existing app, but if it doesn't exist go ahead and start it.
    let app = this.api.getRunningApplication(route.base)
    let sessionId = app && app.sessionId
    if (!app) {
      app = (await this.api.installedApplications()).find((a) => a.path === route.base)
      if (app) {
        sessionId = await this.api.createSession(app)
      }
    }

    if (sessionId) {
      return this.getAppRoot(
        route,
        {
          sessionId,
          base: this.base(route),
          logLevel: logger.level,
        },
        (app && app.name) || ""
      )
    }

    return this.getErrorRoot(route, "404", "404", "Application not found")
  }

  /**
   * Return a resource with variables replaced where necessary.
   */
  protected async getReplacedResource(route: Route): Promise<HttpResponse> {
    if (route.requestPath.endsWith("/manifest.json")) {
      const response = await this.getUtf8Resource(this.rootPath, route.requestPath)
      response.content = response.content
        .replace(/{{BASE}}/g, this.base(route))
        .replace(/{{COMMIT}}/g, this.options.commit)
      return response
    }
    return this.getResource(this.rootPath, route.requestPath)
  }

  public async getRoot(route: Route): Promise<HttpResponse> {
    const recent = await this.api.recent()
    const apps = await this.api.installedApplications()
    const response = await this.getUtf8Resource(this.rootPath, "src/browser/pages/home.html")
    response.content = response.content
      .replace(/{{COMMIT}}/g, this.options.commit)
      .replace(/{{BASE}}/g, this.base(route))
      .replace(/{{UPDATE:NAME}}/, await this.getUpdate())
      .replace(/{{APP_LIST:RUNNING}}/, this.getAppRows(recent.running))
      .replace(
        /{{APP_LIST:EDITORS}}/,
        this.getAppRows(apps.filter((app) => app.categories && app.categories.includes("Editor")))
      )
      .replace(
        /{{APP_LIST:OTHER}}/,
        this.getAppRows(apps.filter((app) => !app.categories || !app.categories.includes("Editor")))
      )
    return response
  }

  public async getAppRoot(route: Route, options: Options, name: string): Promise<HttpResponse> {
    const response = await this.getUtf8Resource(this.rootPath, "src/browser/pages/app.html")
    response.content = response.content
      .replace(/{{COMMIT}}/g, this.options.commit)
      .replace(/{{BASE}}/g, this.base(route))
      .replace(/{{APP_NAME}}/, name)
      .replace(/"{{OPTIONS}}"/, `'${JSON.stringify(options)}'`)
    return response
  }

  public async handleWebSocket(): Promise<undefined> {
    return undefined
  }

  private getAppRows(apps: ReadonlyArray<Application>): string {
    return apps.length > 0 ? apps.map((app) => this.getAppRow(app)).join("\n") : `<div class="none">None</div>`
  }

  private getAppRow(app: Application): string {
    return `<div class="block-row">
      <a class="item -row -link" href=".${app.path}">
        ${
          app.icon
            ? `<img class="icon" src="data:image/png;base64,${app.icon}"></img>`
            : `<div class="icon -missing"></div>`
        }
        <div class="name">${app.name}</div>
      </a>
      ${
        app.sessionId
          ? `<form class="kill-form" action="./delete" method="POST">
               <input type="hidden" name="sessionId" value="${app.sessionId}">
               <button class="kill" type="submit">Kill</button>
             </form>`
          : ""
      }
    </div>`
  }

  private async getUpdate(): Promise<string> {
    if (!this.update.enabled) {
      return `<div class="block-row"><div class="item"><div class="sub">Updates are disabled</div></div></div>`
    }

    const humanize = (time: number): string => {
      const d = new Date(time)
      const pad = (t: number): string => (t < 10 ? "0" : "") + t
      return (
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
        ` ${pad(d.getHours())}:${pad(d.getMinutes())}`
      )
    }

    const update = await this.update.getUpdate()
    if (this.update.isLatestVersion(update)) {
      return `<div class="block-row">
        <div class="item">
          ${update.version}
          <div class="sub">Up to date</div>
        </div>
        <div class="item">
          ${humanize(update.checked)}
          <a class="sub -link" href="./update/check">Check now</a>
        </div>
        <div class="item" >Current: ${this.update.currentVersion}</div>
      </div>`
    }

    return `<div class="block-row">
      <a class="item -link" href="./update">
        ${update.version}
        <div class="sub">Out of date</div>
      </a>
      <div class="item">
        ${humanize(update.checked)}
        <a class="sub -link" href="./update/check">Check now</a>
      </div>
      <div class="item" >Current: ${this.update.currentVersion}</div>
    </div>`
  }
}
