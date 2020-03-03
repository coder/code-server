import * as http from "http"
import { HttpProvider, HttpResponse, Route } from "../http"

/**
 * Static file HTTP provider. Static requests do not require authentication and
 * they only allow access to resources within the application.
 */
export class StaticHttpProvider extends HttpProvider {
  public async handleRequest(route: Route, request: http.IncomingMessage): Promise<HttpResponse> {
    this.ensureMethod(request)
    const response = await this.getReplacedResource(route)
    if (!this.isDev) {
      response.cache = true
    }
    return response
  }

  /**
   * Return a resource with variables replaced where necessary.
   */
  protected async getReplacedResource(route: Route): Promise<HttpResponse> {
    // The first part is always the commit (for caching purposes).
    const split = route.requestPath.split("/").slice(1)

    switch (split[split.length - 1]) {
      case "manifest.json": {
        const response = await this.getUtf8Resource(this.rootPath, ...split)
        return this.replaceTemplates(route, response)
      }
    }
    return this.getResource(this.rootPath, ...split)
  }
}
