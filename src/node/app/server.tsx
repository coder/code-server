import { logger } from "@coder/logger"
import * as http from "http"
import * as React from "react"
import * as ReactDOMServer from "react-dom/server"
import App from "../../browser/app"
import { HttpCode, HttpError } from "../../common/http"
import { Options } from "../../common/util"
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

      case "/": {
        if (route.requestPath !== "/index.html") {
          throw new HttpError("Not found", HttpCode.NotFound)
        }
        const options: Options = {
          authed: !!this.authenticated(request),
          basePath: this.base(route),
          logLevel: logger.level,
        }

        if (options.authed) {
          // TEMP: Auto-load VS Code for now. In future versions we'll need to check
          // the URL for the appropriate application to load, if any.
          options.app = {
            name: "VS Code",
            path: "/",
            embedPath: "/vscode-embed",
          }
        }

        const response = await this.getUtf8Resource(this.rootPath, "src/browser/index.html")
        response.content = response.content
          .replace(/{{COMMIT}}/g, this.options.commit)
          .replace(/{{BASE}}/g, this.base(route))
          .replace(/"{{OPTIONS}}"/g, `'${JSON.stringify(options)}'`)
          .replace(/{{COMPONENT}}/g, ReactDOMServer.renderToString(<App options={options} />))
        return response
      }
    }

    return undefined
  }

  public async handleWebSocket(): Promise<undefined> {
    return undefined
  }
}
