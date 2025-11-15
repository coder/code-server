import { field, logger } from "@coder/logger"
import * as http from "http"
import * as https from "https"
import { ProxyAgent } from "proxy-agent"
import * as semver from "semver"
import * as url from "url"
import { httpProxyUri, version } from "./constants"
import { SettingsProvider, UpdateSettings } from "./settings"

export interface Update {
  checked: number
  version: string
}

export interface LatestResponse {
  name: string
}

/**
 * Provide update information.
 */
export class UpdateProvider {
  private update?: Promise<Update>
  private updateInterval = 1000 * 60 * 60 * 24 // Milliseconds between update checks.

  public constructor(
    /**
     * The URL for getting the latest version of code-server. Should return JSON
     * that fulfills `LatestResponse`.
     */
    private readonly latestUrl: string,
    /**
     * Update information will be stored here.
     */
    private readonly settings: SettingsProvider<UpdateSettings>,
  ) {}

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
        update = { checked: now, version: data.name.replace(/^v/, "") }
        await this.settings.write({ update })
      }
      logger.debug("got latest version", field("latest", update.version))
      return update
    } catch (error: any) {
      logger.error("Failed to get latest version", field("error", error.message))
      return {
        checked: now,
        version: "unknown",
      }
    }
  }

  /**
   * Return true if the currently installed version is the latest.
   */
  public isLatestVersion(latest: Update): boolean {
    logger.debug("comparing versions", field("current", version), field("latest", latest.version))
    try {
      return semver.lte(latest.version, version)
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
        const isHttps = uri.startsWith("https")
        const agent = new ProxyAgent({
          keepAlive: true,
          getProxyForUrl: () => httpProxyUri || "",
        })
        const httpx = isHttps ? https : http
        const client = httpx.get(uri, { headers: { "User-Agent": "code-server" }, agent }, (response) => {
          if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 400) {
            response.destroy()
            return reject(new Error(`${uri}: ${response.statusCode || "500"}`))
          }

          if (response.statusCode >= 300) {
            response.destroy()
            ++redirects
            if (redirects > maxRedirects) {
              return reject(new Error("reached max redirects"))
            }
            if (!response.headers.location) {
              return reject(new Error("received redirect with no location header"))
            }
            return request(url.resolve(uri, response.headers.location))
          }

          resolve(response)
        })
        client.on("error", reject)
      }
      request(uri)
    })
  }
}
