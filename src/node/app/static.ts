import { field, logger } from "@coder/logger"
import * as http from "http"
import * as path from "path"
import { Readable } from "stream"
import * as tarFs from "tar-fs"
import * as zlib from "zlib"
import { HttpProvider, HttpResponse, Route } from "../http"

/**
 * Static file HTTP provider. Regular static requests (the path is the request
 * itself) do not require authentication and they only allow access to resources
 * within the application. Requests for tars (the path is in a query parameter)
 * do require permissions and can access any directory.
 */
export class StaticHttpProvider extends HttpProvider {
  public async handleRequest(route: Route, request: http.IncomingMessage): Promise<HttpResponse> {
    this.ensureMethod(request)

    if (typeof route.query.tar === "string") {
      this.ensureAuthenticated(request)
      return this.getTarredResource(request, route.query.tar)
    }

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

  /**
   * Tar up and stream a directory.
   */
  private async getTarredResource(request: http.IncomingMessage, ...parts: string[]): Promise<HttpResponse> {
    const filePath = path.join(...parts)
    let stream: Readable = tarFs.pack(filePath)
    const headers: http.OutgoingHttpHeaders = {}
    if (request.headers["accept-encoding"] && request.headers["accept-encoding"].includes("gzip")) {
      logger.debug("gzipping tar", field("filePath", filePath))
      const compress = zlib.createGzip()
      stream.pipe(compress)
      stream.on("error", (error) => compress.destroy(error))
      stream.on("close", () => compress.end())
      stream = compress
      headers["content-encoding"] = "gzip"
    }
    return { stream, filePath, mime: "application/x-tar", cache: true, headers }
  }
}
