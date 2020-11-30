import * as crypto from "crypto"
import { Router } from "express"
import { promises as fs } from "fs"
import * as path from "path"
import { commit, rootPath, version } from "../constants"
import { authenticated, ensureAuthenticated, redirect, replaceTemplates } from "../http"
import { getMediaMime, pathToFsPath } from "../util"
import { VscodeProvider } from "../vscode"
import { Router as WsRouter } from "../wsRouter"

export const router = Router()

const vscode = new VscodeProvider()

router.get("/", async (req, res) => {
  if (!authenticated(req)) {
    return redirect(req, res, "login", {
      // req.baseUrl can be blank if already at the root.
      to: req.baseUrl && req.baseUrl !== "/" ? req.baseUrl : undefined,
    })
  }

  const [content, options] = await Promise.all([
    await fs.readFile(path.join(rootPath, "src/browser/pages/vscode.html"), "utf8"),
    (async () => {
      try {
        return await vscode.initialize({ args: req.args, remoteAuthority: req.headers.host || "" }, req.query)
      } catch (error) {
        const devMessage = commit === "development" ? "It might not have finished compiling." : ""
        throw new Error(`VS Code failed to load. ${devMessage} ${error.message}`)
      }
    })(),
  ])

  options.productConfiguration.codeServerVersion = version

  res.send(
    replaceTemplates(
      req,
      // Uncomment prod blocks if not in development. TODO: Would this be
      // better as a build step? Or maintain two HTML files again?
      commit !== "development" ? content.replace(/<!-- PROD_ONLY/g, "").replace(/END_PROD_ONLY -->/g, "") : content,
      {
        disableTelemetry: !!req.args["disable-telemetry"],
        disableUpdateCheck: !!req.args["disable-update-check"],
      },
    )
      .replace(`"{{REMOTE_USER_DATA_URI}}"`, `'${JSON.stringify(options.remoteUserDataUri)}'`)
      .replace(`"{{PRODUCT_CONFIGURATION}}"`, `'${JSON.stringify(options.productConfiguration)}'`)
      .replace(`"{{WORKBENCH_WEB_CONFIGURATION}}"`, `'${JSON.stringify(options.workbenchWebConfiguration)}'`)
      .replace(`"{{NLS_CONFIGURATION}}"`, `'${JSON.stringify(options.nlsConfiguration)}'`),
  )
})

/**
 * TODO: Might currently be unused.
 */
router.get("/resource(/*)?", ensureAuthenticated, async (req, res) => {
  if (typeof req.query.path === "string") {
    res.set("Content-Type", getMediaMime(req.query.path))
    res.send(await fs.readFile(pathToFsPath(req.query.path)))
  }
})

/**
 * Used by VS Code to load files.
 */
router.get("/vscode-remote-resource(/*)?", ensureAuthenticated, async (req, res) => {
  if (typeof req.query.path === "string") {
    res.set("Content-Type", getMediaMime(req.query.path))
    res.send(await fs.readFile(pathToFsPath(req.query.path)))
  }
})

/**
 * VS Code webviews use these paths to load files and to load webview assets
 * like HTML and JavaScript.
 */
router.get("/webview/*", ensureAuthenticated, async (req, res) => {
  res.set("Content-Type", getMediaMime(req.path))
  if (/^vscode-resource/.test(req.params[0])) {
    return res.send(await fs.readFile(req.params[0].replace(/^vscode-resource(\/file)?/, "")))
  }
  return res.send(
    await fs.readFile(path.join(vscode.vsRootPath, "out/vs/workbench/contrib/webview/browser/pre", req.params[0])),
  )
})

export const wsRouter = WsRouter()

wsRouter.ws("/", ensureAuthenticated, async (req) => {
  const magic = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
  const reply = crypto
    .createHash("sha1")
    .update(req.headers["sec-websocket-key"] + magic)
    .digest("base64")
  req.ws.write(
    [
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${reply}`,
    ].join("\r\n") + "\r\n\r\n",
  )
  await vscode.sendWebsocket(req.ws, req.query)
})
