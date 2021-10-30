import * as express from "express"
import path from "path"
import { AuthType, DefaultedArgs } from "../cli"
import { version as codeServerVersion, vsRootPath } from "../constants"
import { ensureAuthenticated, authenticated, redirect } from "../http"
import { loadAMDModule } from "../util"
import { Router as WsRouter, WebsocketRouter } from "../wsRouter"
import { errorHandler } from "./errors"

export interface VSServerResult {
  router: express.Router
  wsRouter: WebsocketRouter
  codeServerMain: CodeServerLib.IServerProcessMain
}

export const createVSServerRouter = async (args: DefaultedArgs): Promise<VSServerResult> => {
  // Delete `VSCODE_CWD` very early even before
  // importing bootstrap files. We have seen
  // reports where `code .` would use the wrong
  // current working directory due to our variable
  // somehow escaping to the parent shell
  // (https://github.com/microsoft/vscode/issues/126399)
  delete process.env["VSCODE_CWD"]

  const bootstrap = require(path.join(vsRootPath, "out", "bootstrap"))
  const bootstrapNode = require(path.join(vsRootPath, "out", "bootstrap-node"))
  const product = require(path.join(vsRootPath, "product.json"))

  // Avoid Monkey Patches from Application Insights
  bootstrap.avoidMonkeyPatchFromAppInsights()

  // Enable portable support
  bootstrapNode.configurePortable(product)

  // Enable ASAR support
  bootstrap.enableASARSupport()

  // Signal processes that we got launched as CLI
  process.env["VSCODE_CLI"] = "1"

  const createVSServer = await loadAMDModule<CodeServerLib.CreateVSServer>("vs/server/entry", "createVSServer")

  const serverUrl = new URL(`${args.cert ? "https" : "http"}://${args.host}:${args.port}`)
  const codeServerMain = await createVSServer({
    codeServerVersion,
    serverUrl,
    args,
    authed: args.auth !== AuthType.None,
    disableUpdateCheck: !!args["disable-update-check"],
  })

  const netServer = await codeServerMain.startup({ listenWhenReady: false })

  const router = express.Router()
  const wsRouter = WsRouter()

  router.get("/", async (req, res, next) => {
    const isAuthenticated = await authenticated(req)
    if (!isAuthenticated) {
      return redirect(req, res, "login", {
        // req.baseUrl can be blank if already at the root.
        to: req.baseUrl && req.baseUrl !== "/" ? req.baseUrl : undefined,
      })
    }
    next()
  })

  router.all("*", ensureAuthenticated, (req, res, next) => {
    req.on("error", (error) => errorHandler(error, req, res, next))

    netServer.emit("request", req, res)
  })

  wsRouter.ws("/", ensureAuthenticated, (req) => {
    netServer.emit("upgrade", req, req.socket, req.head)

    req.socket.resume()
  })

  return {
    router,
    wsRouter,
    codeServerMain,
  }
}
