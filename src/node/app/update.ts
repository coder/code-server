import { field, logger } from "@coder/logger"
import zip from "adm-zip"
import * as cp from "child_process"
import * as fs from "fs-extra"
import * as http from "http"
import * as https from "https"
import * as os from "os"
import * as path from "path"
import * as semver from "semver"
import { Readable, Writable } from "stream"
import * as tar from "tar-fs"
import * as url from "url"
import * as util from "util"
import * as zlib from "zlib"
import { HttpCode, HttpError } from "../../common/http"
import { HttpProvider, HttpProviderOptions, HttpResponse, Route } from "../http"
import { settings as globalSettings, SettingsProvider, UpdateSettings } from "../settings"
import { tmpdir } from "../util"
import { ipcMain } from "../wrapper"

export interface Update {
  checked: number
  version: string
}

export interface LatestResponse {
  name: string
}

/**
 * Update HTTP provider.
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
     * The URL for downloading a version of code-server. {{VERSION}} and
     * {{RELEASE_NAME}} will be replaced (for example 2.1.0 and
     * code-server-2.1.0-linux-x86_64.tar.gz).
     */
    private readonly downloadUrl = "https://github.com/cdr/code-server/releases/download/{{VERSION}}/{{RELEASE_NAME}}",
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

    switch (route.base) {
      case "/check":
        this.getUpdate(true)
        if (route.query && route.query.to) {
          return {
            redirect: Array.isArray(route.query.to) ? route.query.to[0] : route.query.to,
            query: { to: undefined },
          }
        }
        return this.getRoot(route, request)
      case "/apply":
        return this.tryUpdate(route, request)
      case "/":
        return this.getRoot(route, request)
    }

    throw new HttpError("Not found", HttpCode.NotFound)
  }

  public async getRoot(
    route: Route,
    request: http.IncomingMessage,
    errorOrUpdate?: Update | Error,
  ): Promise<HttpResponse> {
    if (request.headers["content-type"] === "application/json") {
      if (!this.enabled) {
        return {
          content: {
            isLatest: true,
          },
        }
      }
      const update = await this.getUpdate()
      return {
        content: {
          ...update,
          isLatest: this.isLatestVersion(update),
        },
      }
    }
    const response = await this.getUtf8Resource(this.rootPath, "src/browser/pages/update.html")
    response.content = response.content
      .replace(
        /{{UPDATE_STATUS}}/,
        errorOrUpdate && !(errorOrUpdate instanceof Error)
          ? `Updated to ${errorOrUpdate.version}`
          : await this.getUpdateHtml(),
      )
      .replace(/{{ERROR}}/, errorOrUpdate instanceof Error ? `<div class="error">${errorOrUpdate.message}</div>` : "")
    return this.replaceTemplates(route, response)
  }

  /**
   * Query for and return the latest update.
   */
  public async getUpdate(force?: boolean): Promise<Update> {
    if (!this.enabled) {
      throw new Error("updates are not enabled")
    }

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

  private async getUpdateHtml(): Promise<string> {
    if (!this.enabled) {
      return "Updates are disabled"
    }

    const update = await this.getUpdate()
    if (this.isLatestVersion(update)) {
      return "No update available"
    }

    return `<button type="submit" class="apply -button">Update to ${update.version}</button>`
  }

  public async tryUpdate(route: Route, request: http.IncomingMessage): Promise<HttpResponse> {
    try {
      const update = await this.getUpdate()
      if (!this.isLatestVersion(update)) {
        await this.downloadAndApplyUpdate(update)
        return this.getRoot(route, request, update)
      }
      return this.getRoot(route, request)
    } catch (error) {
      // For JSON requests propagate the error. Otherwise catch it so we can
      // show the error inline with the update button instead of an error page.
      if (request.headers["content-type"] === "application/json") {
        throw error
      }
      return this.getRoot(route, error)
    }
  }

  public async downloadAndApplyUpdate(update: Update, targetPath?: string): Promise<void> {
    const releaseName = await this.getReleaseName(update)
    const url = this.downloadUrl.replace("{{VERSION}}", update.version).replace("{{RELEASE_NAME}}", releaseName)

    let downloadPath = path.join(tmpdir, "updates", releaseName)
    fs.mkdirp(path.dirname(downloadPath))

    const response = await this.requestResponse(url)

    try {
      if (downloadPath.endsWith(".tar.gz")) {
        downloadPath = await this.extractTar(response, downloadPath)
      } else {
        downloadPath = await this.extractZip(response, downloadPath)
      }
      logger.debug("Downloaded update", field("path", downloadPath))

      // The archive should have a directory inside at the top level with the
      // same name as the archive.
      const directoryPath = path.join(downloadPath, path.basename(downloadPath))
      await fs.stat(directoryPath)

      if (!targetPath) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        targetPath = path.resolve(__dirname, "../../../")
      }

      // Move the old directory to prevent potential data loss.
      const backupPath = path.resolve(targetPath, `../${path.basename(targetPath)}.${Date.now().toString()}`)
      logger.debug("Replacing files", field("target", targetPath), field("backup", backupPath))
      await fs.move(targetPath, backupPath)

      // Move the new directory.
      await fs.move(directoryPath, targetPath)

      await fs.remove(downloadPath)

      if (process.send) {
        ipcMain().relaunch(update.version)
      }
    } catch (error) {
      response.destroy(error)
      throw error
    }
  }

  private async extractTar(response: Readable, downloadPath: string): Promise<string> {
    downloadPath = downloadPath.replace(/\.tar\.gz$/, "")
    logger.debug("Extracting tar", field("path", downloadPath))

    response.pause()
    await fs.remove(downloadPath)

    const decompress = zlib.createGunzip()
    response.pipe(decompress as Writable)
    response.on("error", (error) => decompress.destroy(error))
    response.on("close", () => decompress.end())

    const destination = tar.extract(downloadPath)
    decompress.pipe(destination)
    decompress.on("error", (error) => destination.destroy(error))
    decompress.on("close", () => destination.end())

    await new Promise((resolve, reject) => {
      destination.on("finish", resolve)
      destination.on("error", reject)
      response.resume()
    })

    return downloadPath
  }

  private async extractZip(response: Readable, downloadPath: string): Promise<string> {
    logger.debug("Downloading zip", field("path", downloadPath))

    response.pause()
    await fs.remove(downloadPath)

    const write = fs.createWriteStream(downloadPath)
    response.pipe(write)
    response.on("error", (error) => write.destroy(error))
    response.on("close", () => write.end())

    await new Promise((resolve, reject) => {
      write.on("error", reject)
      write.on("close", resolve)
      response.resume
    })

    const zipPath = downloadPath
    downloadPath = downloadPath.replace(/\.zip$/, "")
    await fs.remove(downloadPath)

    logger.debug("Extracting zip", field("path", zipPath))

    await new Promise((resolve, reject) => {
      new zip(zipPath).extractAllToAsync(downloadPath, true, (error) => {
        return error ? reject(error) : resolve()
      })
    })

    await fs.remove(zipPath)

    return downloadPath
  }

  /**
   * Given an update return the name for the packaged archived.
   */
  public async getReleaseName(update: Update): Promise<string> {
    let target: string = os.platform()
    if (target === "linux") {
      const result = await util
        .promisify(cp.exec)("ldd --version")
        .catch((error) => ({
          stderr: error.message,
          stdout: "",
        }))
      if (/musl/.test(result.stderr) || /musl/.test(result.stdout)) {
        target = "alpine"
      }
    }
    let arch = os.arch()
    if (arch === "x64") {
      arch = "x86_64"
    }
    return `code-server-${update.version}-${target}-${arch}.${target === "darwin" ? "zip" : "tar.gz"}`
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
