import { field, logger } from "@coder/logger"
import * as cp from "child_process"
import * as crypto from "crypto"
import * as fs from "fs-extra"
import * as http from "http"
import * as net from "net"
import * as path from "path"
import {
  CodeServerMessage,
  Options,
  StartPath,
  VscodeMessage,
  VscodeOptions,
  WorkbenchOptions,
} from "../../../lib/vscode/src/vs/server/ipc"
import { HttpCode, HttpError } from "../../common/http"
import { arrayify, generateUuid } from "../../common/util"
import { Args } from "../cli"
import { HttpProvider, HttpProviderOptions, HttpResponse, Route } from "../http"
import { settings } from "../settings"
import { pathToFsPath } from "../util"

export class VscodeHttpProvider extends HttpProvider {
  private readonly serverRootPath: string
  private readonly vsRootPath: string
  private _vscode?: Promise<cp.ChildProcess>

  public constructor(options: HttpProviderOptions, private readonly args: Args) {
    super(options)
    this.vsRootPath = path.resolve(this.rootPath, "lib/vscode")
    this.serverRootPath = path.join(this.vsRootPath, "out/vs/server")
  }

  public get running(): boolean {
    return !!this._vscode
  }

  public async dispose(): Promise<void> {
    if (this._vscode) {
      const vscode = await this._vscode
      vscode.removeAllListeners()
      this._vscode = undefined
      vscode.kill()
    }
  }

  private async initialize(options: VscodeOptions): Promise<WorkbenchOptions> {
    const id = generateUuid()
    const vscode = await this.fork()

    logger.debug("setting up vs code...")
    return new Promise<WorkbenchOptions>((resolve, reject) => {
      vscode.once("message", (message: VscodeMessage) => {
        logger.debug("got message from vs code", field("message", message))
        return message.type === "options" && message.id === id
          ? resolve(message.options)
          : reject(new Error("Unexpected response during initialization"))
      })
      vscode.once("error", reject)
      vscode.once("exit", (code) => reject(new Error(`VS Code exited unexpectedly with code ${code}`)))
      this.send({ type: "init", id, options }, vscode)
    })
  }

  private fork(): Promise<cp.ChildProcess> {
    if (!this._vscode) {
      logger.debug("forking vs code...")
      const vscode = cp.fork(path.join(this.serverRootPath, "fork"))
      vscode.on("error", (error) => {
        logger.error(error.message)
        this._vscode = undefined
      })
      vscode.on("exit", (code) => {
        logger.error(`VS Code exited unexpectedly with code ${code}`)
        this._vscode = undefined
      })

      this._vscode = new Promise((resolve, reject) => {
        vscode.once("message", (message: VscodeMessage) => {
          logger.debug("got message from vs code", field("message", message))
          return message.type === "ready"
            ? resolve(vscode)
            : reject(new Error("Unexpected response waiting for ready response"))
        })
        vscode.once("error", reject)
        vscode.once("exit", (code) => reject(new Error(`VS Code exited unexpectedly with code ${code}`)))
      })
    }

    return this._vscode
  }

  public async handleWebSocket(route: Route, request: http.IncomingMessage, socket: net.Socket): Promise<void> {
    if (!this.authenticated(request)) {
      throw new Error("not authenticated")
    }

    // VS Code expects a raw socket. It will handle all the web socket frames.
    // We just need to handle the initial upgrade.
    // This magic value is specified by the websocket spec.
    const magic = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
    const reply = crypto
      .createHash("sha1")
      .update(request.headers["sec-websocket-key"] + magic)
      .digest("base64")
    socket.write(
      [
        "HTTP/1.1 101 Switching Protocols",
        "Upgrade: websocket",
        "Connection: Upgrade",
        `Sec-WebSocket-Accept: ${reply}`,
      ].join("\r\n") + "\r\n\r\n",
    )

    const vscode = await this._vscode
    this.send({ type: "socket", query: route.query }, vscode, socket)
  }

  private send(message: CodeServerMessage, vscode?: cp.ChildProcess, socket?: net.Socket): void {
    if (!vscode || vscode.killed) {
      throw new Error("vscode is not running")
    }
    vscode.send(message, socket)
  }

  public async handleRequest(route: Route, request: http.IncomingMessage): Promise<HttpResponse> {
    this.ensureMethod(request)

    switch (route.base) {
      case "/":
        if (!this.isRoot(route)) {
          throw new HttpError("Not found", HttpCode.NotFound)
        } else if (!this.authenticated(request)) {
          return { redirect: "/login", query: { to: route.providerBase } }
        }
        try {
          return await this.getRoot(request, route)
        } catch (error) {
          const message = `<div>VS Code failed to load.</div> ${
            this.isDev
              ? `<div>It might not have finished compiling.</div>` +
                `Check for <code>Finished <span class="success">compilation</span></code> in the output.`
              : ""
          } <br><br>${error}`
          return this.getErrorRoot(route, "VS Code failed to load", "500", message)
        }
    }

    this.ensureAuthenticated(request)

    switch (route.base) {
      case "/resource":
      case "/vscode-remote-resource":
        if (typeof route.query.path === "string") {
          return this.getResource(pathToFsPath(route.query.path))
        }
        break
      case "/webview":
        if (/^\/vscode-resource/.test(route.requestPath)) {
          return this.getResource(route.requestPath.replace(/^\/vscode-resource(\/file)?/, ""))
        }
        return this.getResource(this.vsRootPath, "out/vs/workbench/contrib/webview/browser/pre", route.requestPath)
    }

    throw new HttpError("Not found", HttpCode.NotFound)
  }

  private async getRoot(request: http.IncomingMessage, route: Route): Promise<HttpResponse> {
    const remoteAuthority = request.headers.host as string
    const { lastVisited } = await settings.read()
    const startPath = await this.getFirstPath([
      { url: route.query.workspace, workspace: true },
      { url: route.query.folder, workspace: false },
      this.args._ && this.args._.length > 0 ? { url: path.resolve(this.args._[this.args._.length - 1]) } : undefined,
      lastVisited,
    ])
    const [response, options] = await Promise.all([
      await this.getUtf8Resource(this.rootPath, "src/browser/pages/vscode.html"),
      this.initialize({
        args: this.args,
        remoteAuthority,
        startPath,
      }),
    ])

    settings.write({
      lastVisited: startPath || lastVisited, // If startpath is undefined, then fallback to lastVisited
      query: route.query,
    })

    if (!this.isDev) {
      response.content = response.content.replace(/<!-- PROD_ONLY/g, "").replace(/END_PROD_ONLY -->/g, "")
    }

    options.productConfiguration.codeServerVersion = require("../../../package.json").version

    response.content = response.content
      .replace(`"{{REMOTE_USER_DATA_URI}}"`, `'${JSON.stringify(options.remoteUserDataUri)}'`)
      .replace(`"{{PRODUCT_CONFIGURATION}}"`, `'${JSON.stringify(options.productConfiguration)}'`)
      .replace(`"{{WORKBENCH_WEB_CONFIGURATION}}"`, `'${JSON.stringify(options.workbenchWebConfiguration)}'`)
      .replace(`"{{NLS_CONFIGURATION}}"`, `'${JSON.stringify(options.nlsConfiguration)}'`)
    return this.replaceTemplates<Options>(route, response, {
      disableTelemetry: !!this.args["disable-telemetry"],
    })
  }

  /**
   * Choose the first non-empty path.
   */
  private async getFirstPath(
    startPaths: Array<{ url?: string | string[]; workspace?: boolean } | undefined>,
  ): Promise<StartPath | undefined> {
    const isFile = async (path: string): Promise<boolean> => {
      try {
        const stat = await fs.stat(path)
        return stat.isFile()
      } catch (error) {
        logger.warn(error.message)
        return false
      }
    }
    for (let i = 0; i < startPaths.length; ++i) {
      const startPath = startPaths[i]
      const url = arrayify(startPath && startPath.url).find((p) => !!p)
      if (startPath && url) {
        return {
          url,
          // The only time `workspace` is undefined is for the command-line
          // argument, in which case it's a path (not a URL) so we can stat it
          // without having to parse it.
          workspace: typeof startPath.workspace !== "undefined" ? startPath.workspace : await isFile(url),
        }
      }
    }
    return undefined
  }
}
