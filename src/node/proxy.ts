import { Request, Router } from "express"
import proxyServer from "http-proxy"
import { HttpCode, HttpError } from "../common/http"
import { authenticated, ensureAuthenticated, redirect } from "./http"
import { Router as WsRouter } from "./wsRouter"

export const proxy = proxyServer.createProxyServer({})
proxy.on("error", (error, _, res) => {
  res.writeHead(HttpCode.ServerError)
  res.end(error.message)
})

// Intercept the response to rewrite absolute redirects against the base path.
proxy.on("proxyRes", (res, req) => {
  if (res.headers.location && res.headers.location.startsWith("/") && (req as any).base) {
    res.headers.location = (req as any).base + res.headers.location
  }
})

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
  const parts = domain.split(".")

  // There must be an exact match.
  const port = parts.shift()
  const proxyDomain = parts.join(".")
  if (!port || !req.args["proxy-domain"].includes(proxyDomain)) {
    return undefined
  }

  return port
}

router.all("*", (req, res, next) => {
  const port = maybeProxy(req)
  if (!port) {
    return next()
  }

  // Must be authenticated to use the proxy.
  if (!authenticated(req)) {
    // Let the assets through since they're used on the login page.
    if (req.path.startsWith("/static/") && req.method === "GET") {
      return next()
    }

    // Assume anything that explicitly accepts text/html is a user browsing a
    // page (as opposed to an xhr request). Don't use `req.accepts()` since
    // *every* request that I've seen (in Firefox and Chromium at least)
    // includes `*/*` making it always truthy.
    if (typeof req.headers.accepts === "string" && req.headers.accepts.split(",").includes("text/html")) {
      // Let the login through.
      if (/\/login\/?/.test(req.path)) {
        return next()
      }
      // Redirect all other pages to the login.
      return redirect(req, res, "login", {
        to: req.path,
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

wsRouter.ws("*", (req, _, next) => {
  const port = maybeProxy(req)
  if (!port) {
    return next()
  }

  // Must be authenticated to use the proxy.
  ensureAuthenticated(req)

  proxy.ws(req, req.ws, req.head, {
    ignorePath: true,
    target: `http://0.0.0.0:${port}${req.originalUrl}`,
  })
})
