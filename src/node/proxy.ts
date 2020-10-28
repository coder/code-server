import { Request, Router } from "express"
import proxyServer from "http-proxy"
import { HttpCode, HttpError } from "../common/http"
import { authenticated, ensureAuthenticated } from "./http"

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
 *
 * Throw an error if proxying but the user isn't authenticated.
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

/**
 * Determine if the user is browsing /, /login, or static assets and if so fall
 * through to allow the redirect and login flow.
 */
const shouldFallThrough = (req: Request): boolean => {
  // See if it looks like a request for the root or login HTML.
  if (req.accepts("text/html")) {
    if (
      (req.path === "/" && req.method === "GET") ||
      (/\/login\/?/.test(req.path) && (req.method === "GET" || req.method === "POST"))
    ) {
      return true
    }
  }

  // See if it looks like a request for a static asset.
  return req.path.startsWith("/static/") && req.method === "GET"
}

router.all("*", (req, res, next) => {
  const port = maybeProxy(req)
  if (!port) {
    return next()
  }

  // Must be authenticated to use the proxy.
  if (!authenticated(req)) {
    if (shouldFallThrough(req)) {
      return next()
    }
    throw new HttpError("Unauthorized", HttpCode.Unauthorized)
  }

  proxy.web(req, res, {
    ignorePath: true,
    target: `http://0.0.0.0:${port}${req.originalUrl}`,
  })
})

router.ws("*", (socket, head, req, next) => {
  const port = maybeProxy(req)
  if (!port) {
    return next()
  }

  // Must be authenticated to use the proxy.
  ensureAuthenticated(req)

  proxy.ws(req, socket, head, {
    ignorePath: true,
    target: `http://0.0.0.0:${port}${req.originalUrl}`,
  })
})
