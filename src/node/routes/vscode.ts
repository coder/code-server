import { logger } from "@coder/logger"
import * as express from "express"
import { WebsocketRequest } from "../../../typings/pluginapi"
import { logError } from "../../common/util"
import { isDevMode } from "../constants"
import { toVsCodeArgs } from "../cli"
import { settings } from "../settings"
import { ensureAuthenticated, authenticated, redirect } from "../http"
import { loadAMDModule, readCompilationStats } from "../util"
import { Router as WsRouter } from "../wsRouter"
import { errorHandler } from "./errors"

export class CodeServerRouteWrapper {
  /** Assigned in `ensureCodeServerLoaded` */
  private _codeServerMain!: CodeServerLib.IServerAPI
  private _wsRouterWrapper = WsRouter()
  public router = express.Router()

  public get wsRouter() {
    return this._wsRouterWrapper.router
  }

  //#region Route Handlers

  private $root: express.Handler = async (req, res, next) => {
    const isAuthenticated = await authenticated(req)

    if (!isAuthenticated) {
      return redirect(req, res, "login", {
        // req.baseUrl can be blank if already at the root.
        to: req.baseUrl && req.baseUrl !== "/" ? req.baseUrl : undefined,
      })
    }

    // Ew means the workspace was closed so clear the last folder/workspace.
    const { query } = await settings.read()
    if (req.query.ew) {
      delete query.folder
      delete query.workspace
    }

    // Redirect to the last folder/workspace if nothing else is opened.
    if (
      !req.query.folder &&
      !req.query.workspace &&
      (query.folder || query.workspace) &&
      !req.args["ignore-last-opened"] // This flag disables this behavior.
    ) {
      return redirect(req, res, "", {
        folder: query.folder,
        workspace: query.workspace,
      })
    }

    // Store the query parameters so we can use them on the next load.  This
    // also allows users to create functionality around query parameters.
    settings.write({ query: req.query })

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
    this._codeServerMain.handleUpgrade(req, req.socket)

    req.socket.resume()
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

    if (isDevMode) {
      // Is the development mode file watcher still busy?
      const compileStats = await readCompilationStats()

      if (!compileStats || !compileStats.lastCompiledAt) {
        return next(new Error("VS Code may still be compiling..."))
      }
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
      this._codeServerMain = await createVSServer(null, await toVsCodeArgs(args))
    } catch (createServerError) {
      logError(logger, "CodeServerRouteWrapper", createServerError)
      return next(createServerError)
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
  }
}
