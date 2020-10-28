import { field, logger } from "@coder/logger"
import * as crypto from "crypto"
import { RequestHandler, Router } from "express"
import { promises as fs } from "fs"
import * as path from "path"
import { resolve } from "path"
import { ParsedQs } from "qs"
import { Readable } from "stream"
import * as tarFs from "tar-fs"
import * as zlib from "zlib"
import { WorkbenchOptions } from "../../../lib/vscode/src/vs/server/ipc"
import { HttpCode, HttpError } from "../../common/http"
import { commit, rootPath, version } from "../constants"
import { authenticated, commonTemplateVars, ensureAuthenticated, redirect } from "../http"
import { getMediaMime, pathToFsPath } from "../util"
import { VscodeProvider } from "../vscode"
import { Router as WsRouter } from "../wsRouter"
import { createServeDirectoryHandler } from "./static"

export const router = Router()

const vscode = new VscodeProvider()

router.get("/", async (req, res) => {
  if (!authenticated(req)) {
    return redirect(req, res, "login", {
      to: req.baseUrl,
    })
  }

  let workbenchOptions: WorkbenchOptions

  try {
    workbenchOptions = await vscode.initialize(
      {
        args: req.args,
        remoteAuthority: req.headers.host || "",
      },
      req.query,
    )
  } catch (error) {
    const devMessage = commit === "development" ? "It might not have finished compiling." : ""
    throw new Error(`VS Code failed to load. ${devMessage} ${error.message}`)
  }

  workbenchOptions.productConfiguration.codeServerVersion = version

  res.render("vscode/index", {
    ...commonTemplateVars(req),
    disableTelemetry: !!req.args["disable-telemetry"],
    workbenchOptions,
  })
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

createServeDirectoryHandler(router, "/lib", resolve(rootPath, "lib"))

interface TarHandlerQueryParams extends ParsedQs {
  filePath?: string | string[]
}

/**
 * Packs and serves requested file with tar.
 * This is commonly used to fetch an extension on the client.
 *
 * @remark See lib/vscode/src/vs/server/browser/mainThreadNodeProxy.ts#L35
 */
const tarHandler: RequestHandler<any, Buffer, null, TarHandlerQueryParams> = (req, res) => {
  const filePath = Array.isArray(req.query.filePath) ? req.query.filePath[0] : req.query.filePath

  if (!filePath) {
    throw new HttpError("Missing 'filePath' query param", HttpCode.BadRequest)
  }

  const resourcePath = resolve(filePath)

  let stream: Readable = tarFs.pack(pathToFsPath(filePath))

  if (req.headers["accept-encoding"] && req.headers["accept-encoding"].includes("gzip")) {
    logger.debug("gzipping tar", field("path", resourcePath))

    const compress = zlib.createGzip()

    stream.pipe(compress)
    stream.on("error", (error) => compress.destroy(error))
    stream.on("close", () => compress.end())

    stream = compress

    res.header("content-encoding", "gzip")
  }

  res.set("Content-Type", "application/x-tar")
  stream.on("close", () => res.end())

  return stream.pipe(res)
}

router.get("/extension/tar", tarHandler)
