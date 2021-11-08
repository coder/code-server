import * as express from "express"
import { DefaultedArgs } from "../cli"
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
  // See ../../../vendor/modules/code-oss-dev/src/vs/server/main.js.
  const createVSServer = await loadAMDModule<CodeServerLib.CreateServer>(
    "vs/server/remoteExtensionHostAgent",
    "createServer",
  )

  const codeServerMain = await createVSServer(null, {
    connectionToken: "0000",
    ...args,
    // For some reason VS Code takes the port as a string.
    port: typeof args.port !== "undefined" ? args.port.toString() : undefined,
  })

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
    req.on("error", (error: any) => {
      if (error instanceof Error && ["EntryNotFound", "FileNotFound", "HttpError"].includes(error.message)) {
        next()
      }

      errorHandler(error, req, res, next)
    })

    codeServerMain.handleRequest(req, res)
  })

  wsRouter.ws("/", ensureAuthenticated, (req) => {
    codeServerMain.handleUpgrade(req, req.socket)

    req.socket.resume()
  })

  return {
    router,
    wsRouter,
    codeServerMain,
  }
}
