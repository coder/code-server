import { field, logger } from "@coder/logger"
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
import zip from "adm-zip"
import * as zlib from "zlib"
import { HttpCode, HttpError } from "../../common/http"
import { HttpProvider, HttpProviderOptions, HttpResponse, Route } from "../http"
import { tmpdir } from "../util"
import { ipcMain } from "../wrapper"

export interface Update {
  version: string
}

/**
 * Update HTTP provider.
 */
export class UpdateHttpProvider extends HttpProvider {
  private update?: Promise<Update | undefined>

  public constructor(options: HttpProviderOptions, public readonly enabled: boolean) {
    super(options)
  }

  public async handleRequest(route: Route, request: http.IncomingMessage): Promise<HttpResponse | undefined> {
    switch (route.base) {
      case "/": {
        this.ensureMethod(request, ["GET", "POST"])
        if (route.requestPath !== "/index.html") {
          throw new HttpError("Not found", HttpCode.NotFound)
        } else if (!this.authenticated(request)) {
          return { redirect: "/login" }
        }

        switch (request.method) {
          case "GET":
            return this.getRoot(route)
          case "POST":
            return this.tryUpdate(route)
        }
      }
    }

    return undefined
  }

  public async getRoot(route: Route, error?: Error): Promise<HttpResponse> {
    const response = await this.getUtf8Resource(this.rootPath, "src/browser/pages/update.html")
    response.content = response.content
      .replace(/{{COMMIT}}/g, this.options.commit)
      .replace(/{{BASE}}/g, this.base(route))
      .replace(/{{UPDATE_STATUS}}/, await this.getUpdateHtml())
      .replace(/{{ERROR}}/, error ? `<div class="error">${error.message}</div>` : "")
    return response
  }

  public async handleWebSocket(): Promise<undefined> {
    return undefined
  }

  /**
   * Query for and return the latest update.
   */
  public async getUpdate(): Promise<Update | undefined> {
    if (!this.enabled) {
      throw new Error("updates are not enabled")
    }

    if (!this.update) {
      this.update = this._getUpdate()
    }

    return this.update
  }

  private async _getUpdate(): Promise<Update | undefined> {
    const url = "https://api.github.com/repos/cdr/code-server/releases/latest"
    try {
      const buffer = await this.request(url)
      const data = JSON.parse(buffer.toString())
      const latest = { version: data.name }
      logger.debug("Got latest version", field("latest", latest.version))
      return this.isLatestVersion(latest) ? undefined : latest
    } catch (error) {
      logger.error("Failed to get latest version", field("error", error.message))
      return undefined
    }
  }

  public get currentVersion(): string {
    return require(path.resolve(__dirname, "../../../package.json")).version
  }

  /**
   * Return true if the currently installed version is the latest.
   */
  private isLatestVersion(latest: Update): boolean {
    const version = this.currentVersion
    logger.debug("Comparing versions", field("current", version), field("latest", latest.version))
    return latest.version === version || semver.lt(latest.version, version)
  }

  private async getUpdateHtml(): Promise<string> {
    if (!this.enabled) {
      return "Updates are disabled"
    }

    const update = await this.getUpdate()
    if (!update) {
      return "No updates available"
    }

    return `<button type="submit" class="apply">
      Update to ${update.version}
    </button>
    <div class="current">Current: ${this.currentVersion}</div>`
  }

  public async tryUpdate(route: Route): Promise<HttpResponse> {
    try {
      const update = await this.getUpdate()
      if (!update) {
        throw new Error("no update available")
      }
      await this.downloadUpdate(update)
      return {
        redirect: (Array.isArray(route.query.to) ? route.query.to[0] : route.query.to) || "/",
      }
    } catch (error) {
      return this.getRoot(route, error)
    }
  }

  private async downloadUpdate(update: Update): Promise<void> {
    const releaseName = await this.getReleaseName(update)
    const url = `https://github.com/cdr/code-server/releases/download/${update.version.replace}/${releaseName}`

    await fs.mkdirp(tmpdir)

    const response = await this.requestResponse(url)

    try {
      let downloadPath = path.join(tmpdir, releaseName)
      if (downloadPath.endsWith(".tar.gz")) {
        downloadPath = await this.extractTar(response, downloadPath)
      } else {
        downloadPath = await this.extractZip(response, downloadPath)
      }
      logger.debug("Downloaded update", field("path", downloadPath))

      const target = path.resolve(__dirname, "../")
      logger.debug("Replacing files", field("target", target))
      await fs.unlink(target)
      await fs.move(downloadPath, target)

      ipcMain().relaunch(update.version)
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
  private async getReleaseName(update: Update): Promise<string> {
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
        https.get(uri, { headers: { "User-Agent": "code-server" } }, (response) => {
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
            return reject(new Error(`${response.statusCode || "500"}`))
          }

          resolve(response)
        })
      }
      request(uri)
    })
  }
}
