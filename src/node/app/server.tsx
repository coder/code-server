import { logger } from "@coder/logger"
import * as http from "http"
import * as querystring from "querystring"
import * as React from "react"
import * as ReactDOMServer from "react-dom/server"
import App from "../../browser/app"
import { Options } from "../../common/util"
import { HttpProvider, HttpResponse } from "../http"

/**
 * Top-level and fallback HTTP provider.
 */
export class MainHttpProvider extends HttpProvider {
  public async handleRequest(
    base: string,
    requestPath: string,
    _query: querystring.ParsedUrlQuery,
    request: http.IncomingMessage
  ): Promise<HttpResponse | undefined> {
    if (base === "/static") {
      const response = await this.getResource(this.rootPath, requestPath)
      if (!this.isDev) {
        response.cache = true
      }
      return response
    }

    // TEMP: Auto-load VS Code for now. In future versions we'll need to check
    // the URL for the appropriate application to load, if any.
    const app = {
      name: "VS Code",
      path: "/",
      embedPath: "/vscode-embed",
    }

    const options: Options = {
      app,
      authed: !!this.authenticated(request),
      logLevel: logger.level,
    }

    const response = await this.getUtf8Resource(this.rootPath, "src/browser/index.html")
    response.content = response.content
      .replace(/{{COMMIT}}/g, this.options.commit)
      .replace(/"{{OPTIONS}}"/g, `'${JSON.stringify(options)}'`)
      .replace(/{{COMPONENT}}/g, ReactDOMServer.renderToString(<App options={options} />))
    return response
  }

  public async handleWebSocket(): Promise<undefined> {
    return undefined
  }
}
