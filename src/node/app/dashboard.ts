import * as http from "http"
import * as querystring from "querystring"
import { Application, RecentResponse } from "../../common/api"
import { HttpCode, HttpError } from "../../common/http"
import { HttpProvider, HttpProviderOptions, HttpResponse, Route } from "../http"
import { ApiHttpProvider } from "./api"
import { Vscode } from "./bin"
import { UpdateHttpProvider } from "./update"

/**
 * Dashboard HTTP provider.
 */
export class DashboardHttpProvider extends HttpProvider {
  public constructor(
    options: HttpProviderOptions,
    private readonly api: ApiHttpProvider,
    private readonly update: UpdateHttpProvider,
  ) {
    super(options)
  }

  public async handleRequest(route: Route, request: http.IncomingMessage): Promise<HttpResponse> {
    if (route.requestPath !== "/index.html") {
      throw new HttpError("Not found", HttpCode.NotFound)
    }

    switch (route.base) {
      case "/delete": {
        this.ensureAuthenticated(request)
        this.ensureMethod(request, "POST")
        const data = await this.getData(request)
        const p = data ? querystring.parse(data) : {}
        this.api.deleteSession(p.sessionId as string)
        return { redirect: this.options.base }
      }

      case "/": {
        this.ensureMethod(request)
        if (!this.authenticated(request)) {
          return { redirect: "/login", query: { to: this.options.base } }
        }
        return this.getRoot(route)
      }
    }

    throw new HttpError("Not found", HttpCode.NotFound)
  }

  public async getRoot(route: Route): Promise<HttpResponse> {
    const base = this.base(route)
    const apps = await this.api.installedApplications()
    const response = await this.getUtf8Resource(this.rootPath, "src/browser/pages/home.html")
    response.content = response.content
      .replace(/{{UPDATE:NAME}}/, await this.getUpdate(base))
      .replace(/{{APP_LIST:RUNNING}}/, this.getAppRows(base, (await this.api.running()).applications))
      .replace(/{{APP_LIST:RECENT_PROJECTS}}/, this.getRecentProjectRows(base, await this.api.recent()))
      .replace(
        /{{APP_LIST:EDITORS}}/,
        this.getAppRows(
          base,
          apps.filter((app) => app.categories && app.categories.includes("Editor")),
        ),
      )
      .replace(
        /{{APP_LIST:OTHER}}/,
        this.getAppRows(
          base,
          apps.filter((app) => !app.categories || !app.categories.includes("Editor")),
        ),
      )
    return this.replaceTemplates(route, response)
  }

  private getRecentProjectRows(base: string, recents: RecentResponse): string {
    return recents.paths.length > 0 || recents.workspaces.length > 0
      ? recents.paths.map((recent) => this.getRecentProjectRow(base, recent)).join("\n") +
          recents.workspaces.map((recent) => this.getRecentProjectRow(base, recent, true)).join("\n")
      : `<div class="none">No recent directories or workspaces.</div>`
  }

  private getRecentProjectRow(base: string, recent: string, workspace?: boolean): string {
    return `<div class="block-row">
      <a class="item -row -link" href="${base}${Vscode.path}?${workspace ? "workspace" : "folder"}=${recent}">
        <div class="name">${recent}${workspace ? " (workspace)" : ""}</div>
      </a>
    </div>`
  }

  private getAppRows(base: string, apps: ReadonlyArray<Application>): string {
    return apps.length > 0
      ? apps.map((app) => this.getAppRow(base, app)).join("\n")
      : `<div class="none">No applications are currently running.</div>`
  }

  private getAppRow(base: string, app: Application): string {
    return `<div class="block-row">
      <a class="item -row -link" href="${base}${app.path}">
        ${
          app.icon
            ? `<img class="icon" src="data:image/png;base64,${app.icon}"></img>`
            : `<div class="icon -missing"></div>`
        }
        <div class="name">${app.name}</div>
      </a>
      ${
        app.sessionId
          ? `<form class="kill-form" action="${base}${this.options.base}/delete" method="POST">
               <input type="hidden" name="sessionId" value="${app.sessionId}">
               <button class="kill -button" type="submit">Kill</button>
             </form>`
          : ""
      }
    </div>`
  }

  private async getUpdate(base: string): Promise<string> {
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
          <a class="sub -link" href="${base}/update/check?to=${this.options.base}">Check now</a>
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
        <a class="sub -link" href="${base}/update?to=${this.options.base}">Update now</a>
      </div>
      <div class="item" >Current: ${this.update.currentVersion}</div>
    </div>`
  }
}
