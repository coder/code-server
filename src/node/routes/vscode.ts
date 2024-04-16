import { logger } from "@coder/logger"
import * as crypto from "crypto"
import * as express from "express"
import { promises as fs } from "fs"
import * as http from "http"
import * as net from "net"
import * as path from "path"
import { WebsocketRequest } from "../../../typings/pluginapi"
import { logError } from "../../common/util"
import { CodeArgs, toCodeArgs } from "../cli"
import { isDevMode } from "../constants"
import { authenticated, ensureAuthenticated, ensureOrigin, redirect, replaceTemplates, self } from "../http"
import { SocketProxyProvider } from "../socket"
import { isFile, loadAMDModule } from "../util"
import { Router as WsRouter } from "../wsRouter"

/**
 * This is the API of Code's web client server.  code-server delegates requests
 * to Code here.
 */
export interface IServerAPI {
  handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void>
  handleUpgrade(req: http.IncomingMessage, socket: net.Socket): void
  handleServerError(err: Error): void
  dispose(): void
}

// Types for ../../../lib/vscode/src/vs/server/node/server.main.ts:72.
export type CreateServer = (address: string | net.AddressInfo | null, args: CodeArgs) => Promise<IServerAPI>

export class CodeServerRouteWrapper {
  /** Assigned in `ensureCodeServerLoaded` */
  private _codeServerMain!: IServerAPI
  private _wsRouterWrapper = WsRouter()
  private _socketProxyProvider = new SocketProxyProvider()
  public router = express.Router()
  private mintKeyPromise: Promise<Buffer> | undefined

  public get wsRouter() {
    return this._wsRouterWrapper.router
  }

  //#region Route Handlers

  private manifest: express.Handler = async (req, res, next) => {
    const appName = req.args["app-name"] || "code-server"
    res.writeHead(200, { "Content-Type": "application/manifest+json" })

    return res.end(
      replaceTemplates(
        req,
        JSON.stringify(
          {
            name: appName,
            short_name: appName,
            start_url: ".",
            display: "fullscreen",
            display_override: ["window-controls-overlay"],
            description: "Run Code on a remote server.",
            icons: [192, 512].map((size) => ({
              src: `{{BASE}}/_static/src/browser/media/pwa-icon-${size}.png`,
              type: "image/png",
              sizes: `${size}x${size}`,
            })),
          },
          null,
          2,
        ),
      ),
    )
  }

  private mintKey: express.Handler = async (req, res, next) => {
    if (!this.mintKeyPromise) {
      this.mintKeyPromise = new Promise(async (resolve) => {
        const keyPath = path.join(req.args["user-data-dir"], "serve-web-key-half")
        logger.debug(`Reading server web key half from ${keyPath}`)
        try {
          resolve(await fs.readFile(keyPath))
          return
        } catch (error: any) {
          if (error.code !== "ENOENT") {
            logError(logger, `read ${keyPath}`, error)
          }
        }
        // VS Code wants 256 bits.
        const key = crypto.randomBytes(32)
        try {
          await fs.writeFile(keyPath, key)
        } catch (error: any) {
          logError(logger, `write ${keyPath}`, error)
        }
        resolve(key)
      })
    }
    const key = await this.mintKeyPromise
    res.end(key)
  }

  private $root: express.Handler = async (req, res, next) => {
    const isAuthenticated = await authenticated(req)
    const NO_FOLDER_OR_WORKSPACE_QUERY = !req.query.folder && !req.query.workspace
    // Ew means the workspace was closed so clear the last folder/workspace.
    const FOLDER_OR_WORKSPACE_WAS_CLOSED = req.query.ew

    if (!isAuthenticated) {
      const to = self(req)
      return redirect(req, res, "login", {
        to: to !== "/" ? to : undefined,
      })
    }

    if (NO_FOLDER_OR_WORKSPACE_QUERY && !FOLDER_OR_WORKSPACE_WAS_CLOSED) {
      const settings = await req.settings.read()
      const lastOpened = settings.query || {}
      // This flag disables the last opened behavior
      const IGNORE_LAST_OPENED = req.args["ignore-last-opened"]
      const HAS_LAST_OPENED_FOLDER_OR_WORKSPACE = lastOpened.folder || lastOpened.workspace
      const HAS_FOLDER_OR_WORKSPACE_FROM_CLI = req.args._.length > 0
      const to = self(req)

      let folder = undefined
      let workspace = undefined

      // Redirect to the last folder/workspace if nothing else is opened.
      if (HAS_LAST_OPENED_FOLDER_OR_WORKSPACE && !IGNORE_LAST_OPENED) {
        folder = lastOpened.folder
        workspace = lastOpened.workspace
      } else if (HAS_FOLDER_OR_WORKSPACE_FROM_CLI) {
        const lastEntry = path.resolve(req.args._[req.args._.length - 1])
        const entryIsFile = await isFile(lastEntry)
        const IS_WORKSPACE_FILE = entryIsFile && path.extname(lastEntry) === ".code-workspace"

        if (IS_WORKSPACE_FILE) {
          workspace = lastEntry
        } else if (!entryIsFile) {
          folder = lastEntry
        }
      }

      if (folder || workspace) {
        return redirect(req, res, to, {
          folder,
          workspace,
        })
      }
    }

    // Store the query parameters so we can use them on the next load.  This
    // also allows users to create functionality around query parameters.
    await req.settings.write({ query: req.query })

    next()
  }

  private $proxyRequest: express.Handler = async (req, res, next) => {
    this._codeServerMain.handleRequest(req, res)
  }

  private $proxyWebsocket = async (req: WebsocketRequest) => {
    const wrappedSocket = await this._socketProxyProvider.createProxy(req.ws)
    // This should actually accept a duplex stream but it seems Code has not
    // been updated to match the Node 16 types so cast for now.  There does not
    // appear to be any code specific to sockets so this should be fine.
    this._codeServerMain.handleUpgrade(req, wrappedSocket as net.Socket)

    req.ws.resume()
  }

  //#endregion

  /**
   * Fetches a code server instance asynchronously to avoid an initial memory overhead.
   */
  private ensureCodeServerLoaded: express.Handler = async (req, _res, next) => {
    if (this._codeServerMain) {
      // Already loaded...
      return next()
    }

    // Create the server...

    const { args } = req

    // See ../../../lib/vscode/src/vs/server/node/server.main.ts:72.
    const createVSServer = await loadAMDModule<CreateServer>("vs/server/node/server.main", "createServer")

    try {
      this._codeServerMain = await createVSServer(null, {
        ...(await toCodeArgs(args)),
        "without-connection-token": true,
      })
    } catch (error) {
      logError(logger, "CodeServerRouteWrapper", error)
      if (isDevMode) {
        return next(new Error((error instanceof Error ? error.message : error) + " (VS Code may still be compiling)"))
      }
      return next(error)
    }

    return next()
  }

  constructor() {
    this.router.get("/", this.ensureCodeServerLoaded, this.$root)
    this.router.get("/manifest.json", this.manifest)
    this.router.post("/mint-key", this.mintKey)
    this.router.all(/.*/, ensureAuthenticated, this.ensureCodeServerLoaded, this.$proxyRequest)
    this._wsRouterWrapper.ws(/.*/, ensureOrigin, ensureAuthenticated, this.ensureCodeServerLoaded, this.$proxyWebsocket)
  }

  dispose() {
    this._codeServerMain?.dispose()
    this._socketProxyProvider.stop()
  }
}
