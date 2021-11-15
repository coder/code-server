import { logger } from "@coder/logger"
import * as express from "express"
import { WebsocketRequest } from "../../../typings/pluginapi"
import { logError } from "../../common/util"
import { isDevMode } from "../constants"
import { ensureAuthenticated, authenticated, redirect } from "../http"
import { loadAMDModule } from "../util"
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
      return next()
    }

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
        connectionToken: "0000",
        ...args,
        // For some reason VS Code takes the port as a string.
        port: args.port?.toString(),
      })
    } catch (createServerError) {
      logError(logger, "CodeServerRouteWrapper", createServerError)

      const loggedError = isDevMode ? new Error("VS Code may still be compiling...") : createServerError

      return next(loggedError)
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
