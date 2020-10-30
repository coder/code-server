import * as crypto from "crypto"
import { Router } from "express"
import { promises as fs } from "fs"
import * as path from "path"
import { WorkbenchOptions } from "../../../lib/vscode/src/vs/server/ipc"
import { commit, version } from "../constants"
import { authenticated, ensureAuthenticated, redirect } from "../http"
import { getMediaMime, pathToFsPath } from "../util"
import { VscodeProvider } from "../vscode"

export const router = Router()

const vscode = new VscodeProvider()

router.get("/", async (req, res) => {
  if (!authenticated(req)) {
    return redirect(req, res, "login", {
      to: req.baseUrl || "/",
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

  res.render("vscode", {
    disableTelemetry: !!req.args["disable-telemetry"],
    workbenchOptions,
  })
})

router.ws("/", async (socket, _, req) => {
  ensureAuthenticated(req)
  const magic = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
  const reply = crypto
    .createHash("sha1")
    .update(req.headers["sec-websocket-key"] + magic)
    .digest("base64")
  socket.write(
    [
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${reply}`,
    ].join("\r\n") + "\r\n\r\n",
  )
  await vscode.sendWebsocket(socket, req.query)
})

router.get("/resource(/*)?", async (req, res) => {
  ensureAuthenticated(req)
  if (typeof req.query.path === "string") {
    res.set("Content-Type", getMediaMime(req.query.path))
    res.send(await fs.readFile(pathToFsPath(req.query.path)))
  }
})

router.get("/vscode-remote-resource(/*)?", async (req, res) => {
  ensureAuthenticated(req)
  if (typeof req.query.path === "string") {
    res.set("Content-Type", getMediaMime(req.query.path))
    res.send(await fs.readFile(pathToFsPath(req.query.path)))
  }
})

router.get("/webview/*", async (req, res) => {
  ensureAuthenticated(req)
  res.set("Content-Type", getMediaMime(req.path))
  if (/^vscode-resource/.test(req.params[0])) {
    return res.send(await fs.readFile(req.params[0].replace(/^vscode-resource(\/file)?/, "")))
  }
  return res.send(
    await fs.readFile(path.join(vscode.vsRootPath, "out/vs/workbench/contrib/webview/browser/pre", req.params[0])),
  )
})
