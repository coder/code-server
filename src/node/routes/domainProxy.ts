import { logger } from "@coder/logger"
import { Request, Router } from "express"
import fs from "fs"
import { WORKSPACE_HOME_DIRECTORY_PATH } from "../../common/constants"
import { HttpCode, HttpError } from "../../common/http"
import { normalize } from "../../common/util"
import { authenticated, ensureAuthenticated, redirect } from "../http"
import { proxy } from "../proxy"
import { FindFiles } from "../util"
import { Router as WsRouter } from "../wsRouter"

export const router = Router()

/**
 * Return the port if the request should be proxied. Anything that ends in a
 * proxy domain and has a *single* subdomain should be proxied. Anything else
 * should return `undefined` and will be handled as normal.
 *
 * For example if `coder.com` is specified `8080.coder.com` will be proxied
 * but `8080.test.coder.com` and `test.8080.coder.com` will not.
 */
const maybeProxy = (req: Request): string | undefined => {
  // Split into parts.
  const host = req.headers.host || ""
  const idx = host.indexOf(":")
  const domain = idx !== -1 ? host.substring(0, idx) : host
  const separator = req.args["proxy-port-separator"] === "dash" ? "-" : "."
  const parts = domain.split(separator)

  // There must be an exact match.
  const port = parts.shift()
  const proxyDomain = parts.join(separator)
  if (!port || !req.args["proxy-domain"].includes(proxyDomain)) {
    return undefined
  }

  return port
}

router.all("*", async (req, res, next) => {
  const port = maybeProxy(req)
  if (!port) {
    return next()
  }

  // Must be authenticated or specify port as open to use the proxy.
  let portFiles: Array<{ dir: string; file: string }> = []
  try {
    console.log("starting here")
    portFiles = await FindFiles(WORKSPACE_HOME_DIRECTORY_PATH, /ports.txt/g, 10)
    console.log("ending here")
  } catch (error) {
    if (error) logger.debug(`Error in domain proxy: ${error}`)
    portFiles = []
  }

  console.log("portFiles", portFiles)
  let publicPorts: Array<string> = []
  for (let i = 0; i < portFiles.length; i++) {
    const filePath = `${portFiles[i].dir}/${portFiles[i].file}`
    const portsFileString = fs.readFileSync(filePath, "utf8")
    const ports = portsFileString.split("\n").filter((port) => port !== "")
    publicPorts = publicPorts.concat(ports)
  }

  const portIsPublic = publicPorts.includes(port)
  const isAuthenticated = await authenticated(req)
  console.log("portIsPublic", portIsPublic)
  console.log("isAuthenticated", isAuthenticated)
  if (!isAuthenticated && !portIsPublic) {
    console.log("in here")
    // Let the assets through since they're used on the login page.
    if (req.path.startsWith("/static/") && req.method === "GET") {
      return next()
    }

    // Assume anything that explicitly accepts text/html is a user browsing a
    // page (as opposed to an xhr request). Don't use `req.accepts()` since
    // *every* request that I've seen (in Firefox and Chromium at least)
    // includes `*/*` making it always truthy. Even for css/javascript.
    if (req.headers.accept && req.headers.accept.includes("text/html")) {
      // Let the login through.
      if (/\/login\/?/.test(req.path)) {
        return next()
      }
      // Redirect all other pages to the login.
      const to = normalize(`${req.baseUrl}${req.path}`)
      return redirect(req, res, "login", {
        to: to !== "/" ? to : undefined,
      })
    }

    // Everything else gets an unauthorized message.
    throw new HttpError("Unauthorized", HttpCode.Unauthorized)
  }

  proxy.web(req, res, {
    ignorePath: true,
    target: `http://0.0.0.0:${port}${req.originalUrl}`,
  })
})

export const wsRouter = WsRouter()

wsRouter.ws("*", async (req, _, next) => {
  const port = maybeProxy(req)
  if (!port) {
    return next()
  }

  // Must be authenticated to use the proxy.
  await ensureAuthenticated(req)

  proxy.ws(req, req.ws, req.head, {
    ignorePath: true,
    target: `http://0.0.0.0:${port}${req.originalUrl}`,
  })
})
