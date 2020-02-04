import { logger } from "@coder/logger"
import * as React from "react"
import * as ReactDOMServer from "react-dom/server"
import * as ReactRouterDOM from "react-router-dom"
import App from "../../browser/app"
import { HttpProvider, HttpResponse } from "../http"

/**
 * Top-level and fallback HTTP provider.
 */
export class MainHttpProvider extends HttpProvider {
  public async handleRequest(base: string, requestPath: string): Promise<HttpResponse | undefined> {
    if (base === "/static") {
      const response = await this.getResource(this.rootPath, requestPath)
      response.cache = true
      return response
    }

    const response = await this.getUtf8Resource(this.rootPath, "src/browser/index.html")
    response.content = response.content
      .replace(/{{COMMIT}}/g, "") // TODO
      .replace(/"{{OPTIONS}}"/g, `'${JSON.stringify({ logLevel: logger.level })}'`)
      .replace(
        /{{COMPONENT}}/g,
        ReactDOMServer.renderToString(
          <ReactRouterDOM.StaticRouter location={base}>
            <App />
          </ReactRouterDOM.StaticRouter>
        )
      )
    return response
  }

  public async handleWebSocket(): Promise<undefined> {
    return undefined
  }
}
