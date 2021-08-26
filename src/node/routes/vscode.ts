import * as express from "express"
import { AuthType, DefaultedArgs } from "../cli"
import { version as codeServerVersion } from "../constants"
import { ensureAuthenticated } from "../http"
import { loadAMDModule } from "../util"
import { Router as WsRouter } from "../wsRouter"

export const createVSServerRouter = async (args: DefaultedArgs) => {
  const vscodeServerMain = await loadAMDModule<CodeServerLib.CreateVSServer>("vs/server/entry", "createVSServer")

  const serverUrl = new URL(`${args.cert ? "https" : "http"}://${args.host}:${args.port}`)
  const vscodeServer = await vscodeServerMain({
    codeServerVersion,
    serverUrl,
    args,
    authed: args.auth !== AuthType.None,
    disableUpdateCheck: !!args["disable-update-check"],
  })

  const router = express.Router()
  const wsRouter = WsRouter()

  router.all("*", ensureAuthenticated, (req, res) => {
    vscodeServer.emit("request", req, res)
  })

  wsRouter.ws("/", ensureAuthenticated, (req) => {
    vscodeServer.emit("upgrade", req, req.socket, req.head)

    req.socket.resume()
  })

  return { router, wsRouter }
}
