import * as http from "http"
import * as querystring from "querystring"
import { Application } from "../../common/api"
import { HttpCode, HttpError } from "../../common/http"
import { normalize } from "../../common/util"
import { HttpProvider, HttpProviderOptions, HttpResponse, Route } from "../http"
import { ApiHttpProvider } from "./api"
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
    if (!this.isRoot(route)) {
      throw new HttpError("Not found", HttpCode.NotFound)
    }

    switch (route.base) {
      case "/spawn": {
        this.ensureAuthenticated(request)
        this.ensureMethod(request, "POST")
        const data = await this.getData(request)
        const app = data ? querystring.parse(data) : {}
        if (app.path) {
          return { redirect: Array.isArray(app.path) ? app.path[0] : app.path }
        }
        if (!app.exec) {
          throw new Error("No exec was provided")
        }
        this.api.spawnProcess(Array.isArray(app.exec) ? app.exec[0] : app.exec)
        return { redirect: this.options.base }
      }
      case "/app":
      case "/": {
        this.ensureMethod(request)
        if (!this.authenticated(request)) {
          return { redirect: "/login", query: { to: this.options.base } }
        }
        return route.base === "/" ? this.getRoot(route) : this.getAppRoot(route)
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

  public async getAppRoot(route: Route): Promise<HttpResponse> {
    const response = await this.getUtf8Resource(this.rootPath, "src/browser/pages/app.html")
    return this.replaceTemplates(route, response)
  }

  private getAppRows(base: string, apps: ReadonlyArray<Application>): string {
    return apps.length > 0
      ? apps.map((app) => this.getAppRow(base, app)).join("\n")
      : `<div class="none">No applications found.</div>`
  }

  private getAppRow(base: string, app: Application): string {
    return `<form class="block-row${app.exec ? " -x11" : ""}" method="post" action="${normalize(
      `${base}${this.options.base}/spawn`,
    )}">
      <button class="item -row -link">
        <input type="hidden" name="path" value="${app.path || ""}">
        <input type="hidden" name="exec" value="${app.exec || ""}">
        ${
          app.icon
            ? `<img class="icon" src="data:image/png;base64,${app.icon}"></img>`
            : `<span class="icon -missing"></span>`
        }
        <span class="name">${app.name}</span>
      </button>
    </form>`
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
