import { field, logger } from "@coder/logger"
import * as http from "http"
import * as https from "https"
import * as path from "path"
import * as semver from "semver"
import * as url from "url"
import { HttpCode, HttpError } from "../../common/http"
import { HttpProvider, HttpProviderOptions, HttpResponse, Route } from "../http"
import { settings as globalSettings, SettingsProvider, UpdateSettings } from "../settings"

export interface Update {
  checked: number
  version: string
}

export interface LatestResponse {
  name: string
}

/**
 * HTTP provider for checking updates (does not download/install them).
 */
export class UpdateHttpProvider extends HttpProvider {
  private update?: Promise<Update>
  private updateInterval = 1000 * 60 * 60 * 24 // Milliseconds between update checks.

  public constructor(
    options: HttpProviderOptions,
    public readonly enabled: boolean,
    /**
     * The URL for getting the latest version of code-server. Should return JSON
     * that fulfills `LatestResponse`.
     */
    private readonly latestUrl = "https://api.github.com/repos/cdr/code-server/releases/latest",
    /**
     * Update information will be stored here. If not provided, the global
     * settings will be used.
     */
    private readonly settings: SettingsProvider<UpdateSettings> = globalSettings,
  ) {
    super(options)
  }

  public async handleRequest(route: Route, request: http.IncomingMessage): Promise<HttpResponse> {
    this.ensureAuthenticated(request)
    this.ensureMethod(request)

    if (!this.isRoot(route)) {
      throw new HttpError("Not found", HttpCode.NotFound)
    }

    if (!this.enabled) {
      throw new Error("update checks are disabled")
    }

    switch (route.base) {
      case "/check":
      case "/": {
        const update = await this.getUpdate(route.base === "/check")
        return {
          content: {
            ...update,
            isLatest: this.isLatestVersion(update),
          },
        }
      }
    }

    throw new HttpError("Not found", HttpCode.NotFound)
  }

  /**
   * Query for and return the latest update.
   */
  public async getUpdate(force?: boolean): Promise<Update> {
    // Don't run multiple requests at a time.
    if (!this.update) {
      this.update = this._getUpdate(force)
      this.update.then(() => (this.update = undefined))
    }

    return this.update
  }

  private async _getUpdate(force?: boolean): Promise<Update> {
    const now = Date.now()
    try {
      let { update } = !force ? await this.settings.read() : { update: undefined }
      if (!update || update.checked + this.updateInterval < now) {
        const buffer = await this.request(this.latestUrl)
        const data = JSON.parse(buffer.toString()) as LatestResponse
        update = { checked: now, version: data.name }
        await this.settings.write({ update })
      }
      logger.debug("got latest version", field("latest", update.version))
      return update
    } catch (error) {
      logger.error("Failed to get latest version", field("error", error.message))
      return {
        checked: now,
        version: "unknown",
      }
    }
  }

  public get currentVersion(): string {
    return require(path.resolve(__dirname, "../../../package.json")).version
  }

  /**
   * Return true if the currently installed version is the latest.
   */
  public isLatestVersion(latest: Update): boolean {
    const version = this.currentVersion
    logger.debug("comparing versions", field("current", version), field("latest", latest.version))
    try {
      return latest.version === version || semver.lt(latest.version, version)
    } catch (error) {
      return true
    }
  }

  private async request(uri: string): Promise<Buffer> {
    const response = await this.requestResponse(uri)
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      let bufferLength = 0
      response.on("data", (chunk) => {
        bufferLength += chunk.length
        chunks.push(chunk)
      })
      response.on("error", reject)
      response.on("end", () => {
        resolve(Buffer.concat(chunks, bufferLength))
      })
    })
  }

  private async requestResponse(uri: string): Promise<http.IncomingMessage> {
    let redirects = 0
    const maxRedirects = 10
    return new Promise((resolve, reject) => {
      const request = (uri: string): void => {
        logger.debug("Making request", field("uri", uri))
        const httpx = uri.startsWith("https") ? https : http
        const client = httpx.get(uri, { headers: { "User-Agent": "code-server" } }, (response) => {
          if (
            response.statusCode &&
            response.statusCode >= 300 &&
            response.statusCode < 400 &&
            response.headers.location
          ) {
            ++redirects
            if (redirects > maxRedirects) {
              return reject(new Error("reached max redirects"))
            }
            response.destroy()
            return request(url.resolve(uri, response.headers.location))
          }

          if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 400) {
            return reject(new Error(`${uri}: ${response.statusCode || "500"}`))
          }

          resolve(response)
        })
        client.on("error", reject)
      }
      request(uri)
    })
  }
}
