import { Request, Router } from "express"
import proxyServer from "http-proxy"
import { HttpCode } from "../common/http"
import { ensureAuthenticated } from "./http"

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

  // Must be authenticated to use the proxy.
  ensureAuthenticated(req)

  return port
}

router.all("*", (req, res, next) => {
  const port = maybeProxy(req)
  if (!port) {
    return next()
  }

  proxy.web(req, res, {
    ignorePath: true,
    target: `http://127.0.0.1:${port}${req.originalUrl}`,
  })
})

router.ws("*", (socket, head, req, next) => {
  const port = maybeProxy(req)
  if (!port) {
    return next()
  }

  proxy.ws(req, socket, head, {
    ignorePath: true,
    target: `http://127.0.0.1:${port}${req.originalUrl}`,
  })
})
