import { logger } from "@coder/logger"
import { Request, Router } from "express"
import fs from "fs"
import yaml from "js-yaml"
import { WORKSPACE_HOME_DIRECTORY_PATH } from "../../common/constants"
import { HttpCode, HttpError } from "../../common/http"
import { normalize } from "../../common/util"
import { authenticated, redirect } from "../http"
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

/**
 * Returns all ports that have been marked as public, specified in the ports.yaml
 * file in our .brev folder. We recursively search through all ports.yaml files and
 * add them to our list.
 *
 * Ports are either numbers or aliases like "5000" or "alias:5000".
 */
const getPublicPorts = async (baseDir: string): Promise<[string[], { [key: string]: string }]> => {
  let portFiles: Array<{ dir: string; file: string }> = []
  try {
    logger.debug(`Directory path: ${baseDir}`)
    // Recursively search for ports.yaml files
    portFiles = await FindFiles(baseDir, /ports.yaml/g, 5)
  } catch (error) {
    if (error) logger.debug(`Error in domain proxy: ${error}`)
    portFiles = []
  }

  let publicPorts: Array<string> = []
  const portMappings: { [key: string]: string } = {}
  for (let i = 0; i < portFiles.length; i++) {
    const filePath = `${portFiles[i].dir}/${portFiles[i].file}`
    const portsFileString = fs.readFileSync(filePath, "utf8")
    const yamlData = yaml.load(portsFileString)

    // Extract port entries from file
    let ports: Array<string> = []
    if (yamlData && typeof yamlData === "object" && "ports" in yamlData) {
      ports = (yamlData as { version: number; ports: Array<string> })["ports"]
    }

    // Filter and track entries that are mappings from file
    for (let j = 0; j < ports.length; j++) {
      const entry = ports[j]
      if (entry.includes(":")) {
        ports = ports.filter((v) => v !== entry)
        const aliasPortEntry = entry.split(":")
        const [alias, portValue] = aliasPortEntry
        portMappings[alias] = portValue
        ports = ports.concat([alias, portValue])
      }
    }

    publicPorts = publicPorts.concat(ports)
  }

  return [publicPorts, portMappings]
}

router.all("*", async (req, res, next) => {
  const port = maybeProxy(req)
  if (!port) {
    return next()
  }

  // Must be authenticated or specify port as open to use the proxy.
  const [publicPorts, portMappings] = await getPublicPorts(WORKSPACE_HOME_DIRECTORY_PATH)
  const portIsPublic = publicPorts.includes(port)
  const isAuthenticated = await authenticated(req)
  if (!isAuthenticated && !portIsPublic) {
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
    target: `http://0.0.0.0:${portMappings[port] ? portMappings[port] : port}${req.originalUrl}`,
  })
})

export const wsRouter = WsRouter()

wsRouter.ws("*", async (req, _, next) => {
  const port = maybeProxy(req)
  if (!port) {
    return next()
  }

  // Must be authenticated or specify port as open to use the proxy.
  const [publicPorts, portMappings] = await getPublicPorts(WORKSPACE_HOME_DIRECTORY_PATH)
  const portIsPublic = publicPorts.includes(port)
  const isAuthenticated = await authenticated(req)
  if (!isAuthenticated && !portIsPublic) {
    throw new HttpError("Unauthorized", HttpCode.Unauthorized)
  }

  proxy.ws(req, req.ws, req.head, {
    ignorePath: true,
    target: `http://0.0.0.0:${portMappings[port] ? portMappings[port] : port}${req.originalUrl}`,
  })
})
