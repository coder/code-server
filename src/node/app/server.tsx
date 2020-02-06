import { logger } from "@coder/logger"
import * as http from "http"
import * as React from "react"
import * as ReactDOMServer from "react-dom/server"
import App from "../../browser/app"
import { HttpCode, HttpError } from "../../common/http"
import { Options } from "../../common/util"
import { Vscode } from "../api/server"
import { HttpProvider, HttpResponse, Route } from "../http"

/**
 * Top-level and fallback HTTP provider.
 */
export class MainHttpProvider extends HttpProvider {
  public async handleRequest(route: Route, request: http.IncomingMessage): Promise<HttpResponse | undefined> {
    switch (route.base) {
      case "/static": {
        const response = await this.getResource(this.rootPath, route.requestPath)
        if (!this.isDev) {
          response.cache = true
        }
        return response
      }

      case "/vscode":
      case "/": {
        if (route.requestPath !== "/index.html") {
          throw new HttpError("Not found", HttpCode.NotFound)
        }

        const options: Options = {
          authed: !!this.authenticated(request),
          basePath: this.base(route),
          logLevel: logger.level,
        }

        // TODO: Load other apps based on the URL as well.
        if (route.base === Vscode.path && options.authed) {
          options.app = Vscode
        }

        return this.getRoot(route, options)
      }
    }

    return undefined
  }

  public async getRoot(route: Route, options: Options): Promise<HttpResponse> {
    const response = await this.getUtf8Resource(this.rootPath, "src/browser/index.html")
    response.content = response.content
      .replace(/{{COMMIT}}/g, this.options.commit)
      .replace(/{{BASE}}/g, this.base(route))
      .replace(/"{{OPTIONS}}"/g, `'${JSON.stringify(options)}'`)
      .replace(/{{COMPONENT}}/g, ReactDOMServer.renderToString(<App options={options} />))
    return response
  }

  public async handleWebSocket(): Promise<undefined> {
    return undefined
  }
}
