import { field, logger } from "@coder/logger"
import * as http from "http"
import * as path from "path"
import { Readable } from "stream"
import * as tarFs from "tar-fs"
import * as zlib from "zlib"
import { HttpProvider, HttpResponse, Route } from "../http"
import { pathToFsPath } from "../util"

/**
 * Static file HTTP provider. Static requests do not require authentication if
 * the resource is in the application's directory except requests to serve a
 * directory as a tar which always requires authentication.
 */
export class StaticHttpProvider extends HttpProvider {
  public async handleRequest(route: Route, request: http.IncomingMessage): Promise<HttpResponse> {
    this.ensureMethod(request)

    if (typeof route.query.tar === "string") {
      this.ensureAuthenticated(request)
      return this.getTarredResource(request, pathToFsPath(route.query.tar))
    }

    const response = await this.getReplacedResource(request, route)
    if (!this.isDev) {
      response.cache = true
    }
    return response
  }

  /**
   * Return a resource with variables replaced where necessary.
   */
  protected async getReplacedResource(request: http.IncomingMessage, route: Route): Promise<HttpResponse> {
    // The first part is always the commit (for caching purposes).
    const split = route.requestPath.split("/").slice(1)

    const resourcePath = path.resolve("/", ...split)

    // Make sure it's in code-server or a plugin.
    const validPaths = [this.rootPath, process.env.PLUGIN_DIR]
    if (!validPaths.find((p) => p && resourcePath.startsWith(p))) {
      this.ensureAuthenticated(request)
    }

    switch (split[split.length - 1]) {
      case "manifest.json": {
        const response = await this.getUtf8Resource(resourcePath)
        return this.replaceTemplates(route, response)
      }
    }
    return this.getResource(resourcePath)
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
