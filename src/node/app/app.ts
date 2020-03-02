import * as http from "http"
import * as querystring from "querystring"
import { Application, RecentResponse } from "../../common/api"
import { HttpCode, HttpError } from "../../common/http"
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
    private readonly update: UpdateHttpProvider,
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
      return this.getAppRoot(route, (app && app.name) || "", sessionId)
    }

    return this.getErrorRoot(route, "404", "404", "Application not found")
  }

  /**
   * Return a resource with variables replaced where necessary.
   */
  protected async getReplacedResource(route: Route): Promise<HttpResponse> {
    const split = route.requestPath.split("/")
    switch (split[split.length - 1]) {
      case "manifest.json": {
        const response = await this.getUtf8Resource(this.rootPath, route.requestPath)
        return this.replaceTemplates(route, response)
      }
    }
    return this.getResource(this.rootPath, route.requestPath)
  }

  public async getRoot(route: Route): Promise<HttpResponse> {
    const running = await this.api.running()
    const apps = await this.api.installedApplications()
    const response = await this.getUtf8Resource(this.rootPath, "src/browser/pages/home.html")
    response.content = response.content
      .replace(/{{UPDATE:NAME}}/, await this.getUpdate())
      .replace(/{{APP_LIST:RUNNING}}/, this.getAppRows(running.applications))
      .replace(/{{APP_LIST:RECENT_PROJECTS}}/, this.getRecentProjectRows(await this.api.recent()))
      .replace(
        /{{APP_LIST:EDITORS}}/,
        this.getAppRows(apps.filter((app) => app.categories && app.categories.includes("Editor"))),
      )
      .replace(
        /{{APP_LIST:OTHER}}/,
        this.getAppRows(apps.filter((app) => !app.categories || !app.categories.includes("Editor"))),
      )
    return this.replaceTemplates(route, response)
  }

  public async getAppRoot(route: Route, name: string, sessionId: string): Promise<HttpResponse> {
    const response = await this.getUtf8Resource(this.rootPath, "src/browser/pages/app.html")
    response.content = response.content.replace(/{{APP_NAME}}/, name)
    return this.replaceTemplates(route, response, sessionId)
  }

  public async handleWebSocket(): Promise<undefined> {
    return undefined
  }

  private getRecentProjectRows(recents: RecentResponse): string {
    return recents.paths.length > 0 || recents.workspaces.length > 0
      ? recents.paths.map((recent) => this.getRecentProjectRow(recent)).join("\n") +
          recents.workspaces.map((recent) => this.getRecentProjectRow(recent, true)).join("\n")
      : `<div class="none">No recent directories or workspaces.</div>`
  }

  private getRecentProjectRow(recent: string, workspace?: boolean): string {
    return `<div class="block-row">
      <a class="item -row -link" href="./vscode/?${workspace ? "workspace" : "folder"}=${recent}">
        <div class="name">${recent}${workspace ? " (workspace)" : ""}</div>
      </a>
    </div>`
  }

  private getAppRows(apps: ReadonlyArray<Application>): string {
    return apps.length > 0
      ? apps.map((app) => this.getAppRow(app)).join("\n")
      : `<div class="none">No applications are currently running.</div>`
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
               <button class="kill -button" type="submit">Kill</button>
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
          Latest: ${update.version}
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
      <div class="item">
        Latest: ${update.version}
        <div class="sub">Out of date</div>
      </div>
      <div class="item">
        ${humanize(update.checked)}
        <a class="sub -link" href="./update">Update now</a>
      </div>
      <div class="item" >Current: ${this.update.currentVersion}</div>
    </div>`
  }
}
