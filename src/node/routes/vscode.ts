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

export const router = express.Router()

export const wsRouter = WsRouter()

/**
 * The API of VS Code's web client server.  code-server delegates requests to VS
 * Code here.
 *
 * @see ../../../lib/vscode/src/vs/server/node/server.main.ts:72
 */
export interface IVSCodeServerAPI {
  handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void>
  handleUpgrade(req: http.IncomingMessage, socket: net.Socket): void
  handleServerError(err: Error): void
  dispose(): void
}

// See ../../../lib/vscode/src/vs/server/node/server.main.ts:72.
export type CreateServer = (address: string | net.AddressInfo | null, args: CodeArgs) => Promise<IVSCodeServerAPI>

// The VS Code server is dynamically loaded in when a request is made to this
// router by `ensureCodeServerLoaded`.
let vscodeServer: IVSCodeServerAPI | undefined

/**
 * Ensure the VS Code server is loaded.
 */
export const ensureVSCodeLoaded = async (
  req: express.Request,
  _: express.Response,
  next: express.NextFunction,
): Promise<void> => {
  if (vscodeServer) {
    return next()
  }
  // See ../../../lib/vscode/src/vs/server/node/server.main.ts:72.
  const createVSServer = await loadAMDModule<CreateServer>("vs/server/node/server.main", "createServer")
  try {
    vscodeServer = await createVSServer(null, {
      ...(await toCodeArgs(req.args)),
      "accept-server-license-terms": true,
      // This seems to be used to make the connection token flags optional (when
      // set to 1.63) but we have always included them.
      compatibility: "1.64",
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

router.get("/", ensureVSCodeLoaded, async (req, res, next) => {
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
})

router.get("/manifest.json", async (req, res) => {
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
})

let mintKeyPromise: Promise<Buffer> | undefined
router.post("/mint-key", async (req, res) => {
  if (!mintKeyPromise) {
    mintKeyPromise = new Promise(async (resolve) => {
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
  const key = await mintKeyPromise
  res.end(key)
})

router.all(/.*/, ensureAuthenticated, ensureVSCodeLoaded, async (req, res) => {
  vscodeServer!.handleRequest(req, res)
})

const socketProxyProvider = new SocketProxyProvider()
wsRouter.ws(/.*/, ensureOrigin, ensureAuthenticated, ensureVSCodeLoaded, async (req: WebsocketRequest) => {
  const wrappedSocket = await socketProxyProvider.createProxy(req.ws)
  // This should actually accept a duplex stream but it seems Code has not
  // been updated to match the Node 16 types so cast for now.  There does not
  // appear to be any code specific to sockets so this should be fine.
  vscodeServer!.handleUpgrade(req, wrappedSocket as net.Socket)

  req.ws.resume()
})

export function dispose() {
  vscodeServer?.dispose()
  socketProxyProvider.stop()
}
