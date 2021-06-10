import * as crypto from "crypto"
import { Request, Router } from "express"
import { promises as fs } from "fs"
import * as path from "path"
import qs from "qs"
import * as ipc from "../../../typings/ipc"
import { Emitter } from "../../common/emitter"
import { HttpCode, HttpError } from "../../common/http"
import { getFirstString } from "../../common/util"
import { Feature } from "../cli"
import { isDevMode, rootPath, version } from "../constants"
import { authenticated, ensureAuthenticated, redirect, replaceTemplates } from "../http"
import { getMediaMime, pathToFsPath } from "../util"
import { VscodeProvider } from "../vscode"
import { Router as WsRouter } from "../wsRouter"

export const router = Router()

const vscode = new VscodeProvider()

router.get("/", async (req, res) => {
  const isAuthenticated = await authenticated(req)
  if (!isAuthenticated) {
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
        const devMessage = isDevMode ? "It might not have finished compiling." : ""
        throw new Error(`VS Code failed to load. ${devMessage} ${error.message}`)
      }
    })(),
  ])

  options.productConfiguration.codeServerVersion = version

  res.send(
    replaceTemplates<ipc.Options>(
      req,
      // Uncomment prod blocks if not in development. TODO: Would this be
      // better as a build step? Or maintain two HTML files again?
      !isDevMode ? content.replace(/<!-- PROD_ONLY/g, "").replace(/END_PROD_ONLY -->/g, "") : content,
      {
        authed: req.args.auth !== "none",
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

interface Callback {
  uri: {
    scheme: string
    authority?: string
    path?: string
    query?: string
    fragment?: string
  }
  timeout: NodeJS.Timeout
}

const callbacks = new Map<string, Callback>()
const callbackEmitter = new Emitter<{ id: string; callback: Callback }>()

/**
 * Get vscode-requestId from the query and throw if it's missing or invalid.
 */
const getRequestId = (req: Request): string => {
  if (!req.query["vscode-requestId"]) {
    throw new HttpError("vscode-requestId is missing", HttpCode.BadRequest)
  }

  if (typeof req.query["vscode-requestId"] !== "string") {
    throw new HttpError("vscode-requestId is not a string", HttpCode.BadRequest)
  }

  return req.query["vscode-requestId"]
}

// Matches VS Code's fetch timeout.
const fetchTimeout = 5 * 60 * 1000

// The callback endpoints are used during authentication. A URI is stored on
// /callback and then fetched later on /fetch-callback.
// See ../../../lib/vscode/resources/web/code-web.js
router.get("/callback", ensureAuthenticated, async (req, res) => {
  const uriKeys = [
    "vscode-requestId",
    "vscode-scheme",
    "vscode-authority",
    "vscode-path",
    "vscode-query",
    "vscode-fragment",
  ]

  const id = getRequestId(req)

  // Move any query variables that aren't URI keys into the URI's query
  // (importantly, this will include the code for oauth).
  const query: qs.ParsedQs = {}
  for (const key in req.query) {
    if (!uriKeys.includes(key)) {
      query[key] = req.query[key]
    }
  }

  const callback = {
    uri: {
      scheme: getFirstString(req.query["vscode-scheme"]) || "code-oss",
      authority: getFirstString(req.query["vscode-authority"]),
      path: getFirstString(req.query["vscode-path"]),
      query: (getFirstString(req.query.query) || "") + "&" + qs.stringify(query),
      fragment: getFirstString(req.query["vscode-fragment"]),
    },
    // Make sure the map doesn't leak if nothing fetches this URI.
    timeout: setTimeout(() => callbacks.delete(id), fetchTimeout),
  }

  callbacks.set(id, callback)
  callbackEmitter.emit({ id, callback })

  res.sendFile(path.join(rootPath, "lib/vscode/resources/web/callback.html"))
})

router.get("/fetch-callback", ensureAuthenticated, async (req, res) => {
  const id = getRequestId(req)

  const send = (callback: Callback) => {
    clearTimeout(callback.timeout)
    callbacks.delete(id)
    res.json(callback.uri)
  }

  const callback = callbacks.get(id)
  if (callback) {
    return send(callback)
  }

  // VS Code will try again if the route returns no content but it seems more
  // efficient to just wait on this request for as long as possible?
  const handler = callbackEmitter.event(({ id: emitId, callback }) => {
    if (id === emitId) {
      handler.dispose()
      send(callback)
    }
  })

  // If the client closes the connection.
  req.on("close", () => handler.dispose())
})

export const wsRouter = WsRouter()

wsRouter.ws("/", ensureAuthenticated, async (req) => {
  const magic = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
  const reply = crypto
    .createHash("sha1")
    .update(req.headers["sec-websocket-key"] + magic)
    .digest("base64")

  const responseHeaders = [
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${reply}`,
  ]

  // See if the browser reports it supports web socket compression.
  // TODO: Parse this header properly.
  const extensions = req.headers["sec-websocket-extensions"]
  const isCompressionSupported = extensions ? extensions.includes("permessage-deflate") : false

  // TODO: For now we only use compression if the user enables it.
  const isCompressionEnabled = !!req.args.enable?.includes(Feature.PermessageDeflate)

  const useCompression = isCompressionEnabled && isCompressionSupported
  if (useCompression) {
    // This response header tells the browser the server supports compression.
    responseHeaders.push("Sec-WebSocket-Extensions: permessage-deflate; server_max_window_bits=15")
  }

  req.ws.write(responseHeaders.join("\r\n") + "\r\n\r\n")

  await vscode.sendWebsocket(req.ws, req.query, useCompression)
})
