import * as express from "express"
import path from "path"
import { DefaultedArgs } from "../cli"
import { vsRootPath } from "../constants"
import { ensureAuthenticated, authenticated, redirect } from "../http"
import { loadAMDModule } from "../util"
import { Router as WsRouter, WebsocketRouter } from "../wsRouter"
import { errorHandler } from "./errors"

export interface VSServerResult {
  router: express.Router
  wsRouter: WebsocketRouter
  codeServerMain: CodeServerLib.IServerAPI
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
  // Seems to be necessary to load modules properly.
  process.env["VSCODE_DEV"] = "1"

  const createVSServer = await loadAMDModule<CodeServerLib.CreateServer>(
    "vs/server/remoteExtensionHostAgentServer",
    "createServer",
  )

  const codeServerMain = await createVSServer(null, { ...args, connectionToken: "0000" }, args["user-data-dir"])

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

    codeServerMain.handleRequest(req, res)
  })

  wsRouter.ws("/", ensureAuthenticated, (req) => {
    codeServerMain.handleUpgrade(req, req.socket)
    // netServer.emit("upgrade", req, req.socket, req.head)

    req.socket.resume()
  })

  return {
    router,
    wsRouter,
    codeServerMain,
  }
}
