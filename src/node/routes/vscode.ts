import { logger } from "@coder/logger"
import * as express from "express"
import * as path from "path"
import { WebsocketRequest } from "../../../typings/pluginapi"
import { logError } from "../../common/util"
import { toVsCodeArgs } from "../cli"
import { isDevMode } from "../constants"
import { authenticated, ensureAuthenticated, redirect, self } from "../http"
import { SocketProxyProvider } from "../socket"
import { isFile, loadAMDModule } from "../util"
import { Router as WsRouter } from "../wsRouter"
import { errorHandler } from "./errors"

export class CodeServerRouteWrapper {
  /** Assigned in `ensureCodeServerLoaded` */
  private _codeServerMain!: CodeServerLib.IServerAPI
  private _wsRouterWrapper = WsRouter()
  private _socketProxyProvider = new SocketProxyProvider()
  public router = express.Router()

  public get wsRouter() {
    return this._wsRouterWrapper.router
  }

  //#region Route Handlers

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
    // We allow certain errors to propagate so that other routers may handle requests
    // outside VS Code
    const requestErrorHandler = (error: any) => {
      if (error instanceof Error && ["EntryNotFound", "FileNotFound", "HttpError"].includes(error.message)) {
        next()
      }
      errorHandler(error, req, res, next)
    }

    req.once("error", requestErrorHandler)

    this._codeServerMain.handleRequest(req, res)
  }

  private $proxyWebsocket = async (req: WebsocketRequest) => {
    const wrappedSocket = await this._socketProxyProvider.createProxy(req.ws)
    this._codeServerMain.handleUpgrade(req, wrappedSocket)

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

    /**
     * @file ../../../vendor/modules/code-oss-dev/src/vs/server/main.js
     */
    const createVSServer = await loadAMDModule<CodeServerLib.CreateServer>(
      "vs/server/remoteExtensionHostAgent",
      "createServer",
    )

    try {
      this._codeServerMain = await createVSServer(null, {
        ...(await toVsCodeArgs(args)),
        // TODO: Make the browser helper script work.
        "without-browser-env-var": true,
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
    this.router.all("*", ensureAuthenticated, this.ensureCodeServerLoaded, this.$proxyRequest)
    this._wsRouterWrapper.ws("/", ensureAuthenticated, this.ensureCodeServerLoaded, this.$proxyWebsocket)
  }

  dispose() {
    this._codeServerMain?.dispose()
    this._socketProxyProvider.stop()
  }
}
