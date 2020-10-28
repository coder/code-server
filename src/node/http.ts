import { field, logger } from "@coder/logger"
import * as express from "express"
import * as expressCore from "express-serve-static-core"
import * as http from "http"
import * as net from "net"
import qs from "qs"
import safeCompare from "safe-compare"
import { HttpCode, HttpError } from "../common/http"
import { normalize, Options } from "../common/util"
import { AuthType } from "./cli"
import { commit, rootPath } from "./constants"
import { Heart } from "./heart"
import { hash } from "./util"

export interface Locals {
  heart: Heart
}

export interface CommonTemplateVars {
  layout: boolean
  TO: string
  BASE: string
  CS_STATIC_BASE: string
  coderOptions: Options
}

export const commonTemplateVars = <T extends Options>(
  req: express.Request,
  extraOpts?: Omit<T, "base" | "csStaticBase" | "logLevel">,
): CommonTemplateVars => {
  const base = relativeRoot(req)
  const coderOptions: Options = {
    base,
    csStaticBase: base + "/static/" + commit + rootPath,
    logLevel: logger.level,
    ...extraOpts,
  }

  return {
    TO: (typeof req.query.to === "string" && req.query.to) || "/",
    BASE: coderOptions.base,
    CS_STATIC_BASE: coderOptions.csStaticBase,
    coderOptions,
    layout: false,
  }
}

/**
 * Throw an error if not authorized.
 */
export const ensureAuthenticated = (req: express.Request): void => {
  if (!authenticated(req)) {
    throw new HttpError("Unauthorized", HttpCode.Unauthorized)
  }
}

/**
 * Return true if authenticated via cookies.
 */
export const authenticated = (req: express.Request): boolean => {
  switch (req.args.auth) {
    case AuthType.None:
      return true
    case AuthType.Password:
      // The password is stored in the cookie after being hashed.
      return req.args.password && req.cookies.key && safeCompare(req.cookies.key, hash(req.args.password))
    default:
      throw new Error(`Unsupported auth type ${req.args.auth}`)
  }
}

/**
 * Get the relative path that will get us to the root of the page. For each
 * slash we need to go up a directory. For example:
 * / => .
 * /foo => .
 * /foo/ => ./..
 * /foo/bar => ./..
 * /foo/bar/ => ./../..
 */
export const relativeRoot = (req: express.Request): string => {
  const depth = (req.originalUrl.split("?", 1)[0].match(/\//g) || []).length
  return normalize("./" + (depth > 1 ? "../".repeat(depth - 1) : ""))
}

/**
 * Redirect relatively to `/${to}`. Query variables will be preserved.
 * `override` will merge with the existing query (use `undefined` to unset).
 */
export const redirect = (
  req: express.Request,
  res: express.Response,
  to: string,
  override: expressCore.Query = {},
): void => {
  const query = Object.assign({}, req.query, override)
  Object.keys(override).forEach((key) => {
    if (typeof override[key] === "undefined") {
      delete query[key]
    }
  })

  const relativePath = normalize(`${relativeRoot(req)}/${to}`, true)
  const queryString = qs.stringify(query)
  const redirectPath = `${relativePath}${queryString ? `?${queryString}` : ""}`
  logger.debug(`redirecting from ${req.originalUrl} to ${redirectPath}`)
  res.redirect(redirectPath)
}

/**
 * Get the value that should be used for setting a cookie domain. This will
 * allow the user to authenticate only once. This will use the highest level
 * domain (e.g. `coder.com` over `test.coder.com` if both are specified).
 */
export const getCookieDomain = (host: string, proxyDomains: string[]): string | undefined => {
  const idx = host.lastIndexOf(":")
  host = idx !== -1 ? host.substring(0, idx) : host
  if (
    // Might be blank/missing, so there's nothing more to do.
    !host ||
    // IP addresses can't have subdomains so there's no value in setting the
    // domain for them. Assume anything with a : is ipv6 (valid domain name
    // characters are alphanumeric or dashes).
    host.includes(":") ||
    // Assume anything entirely numbers and dots is ipv4 (currently tlds
    // cannot be entirely numbers).
    !/[^0-9.]/.test(host) ||
    // localhost subdomains don't seem to work at all (browser bug?).
    host.endsWith(".localhost") ||
    // It might be localhost (or an IP, see above) if it's a proxy and it
    // isn't setting the host header to match the access domain.
    host === "localhost"
  ) {
    logger.debug("no valid cookie doman", field("host", host))
    return undefined
  }

  proxyDomains.forEach((domain) => {
    if (host.endsWith(domain) && domain.length < host.length) {
      host = domain
    }
  })

  logger.debug("got cookie doman", field("host", host))
  return host ? `Domain=${host}` : undefined
}

declare module "express" {
  function Router(options?: express.RouterOptions): express.Router & WithWebsocketMethod

  type WebsocketRequestHandler = (
    socket: net.Socket,
    head: Buffer,
    req: express.Request,
    next: express.NextFunction,
  ) => void | Promise<void>

  type WebsocketMethod<T> = (route: expressCore.PathParams, ...handlers: WebsocketRequestHandler[]) => T

  interface WithWebsocketMethod {
    ws: WebsocketMethod<this>
  }
}

export const handleUpgrade = (app: express.Express, server: http.Server): void => {
  server.on("upgrade", (req, socket, head) => {
    socket.on("error", () => socket.destroy())

    req.ws = socket
    req.head = head
    req._ws_handled = false

    const res = new http.ServerResponse(req)
    res.writeHead = function writeHead(statusCode: number) {
      if (statusCode > 200) {
        socket.destroy(new Error(`${statusCode}`))
      }
      return res
    }

    // Send the request off to be handled by Express.
    ;(app as any).handle(req, res, () => {
      if (!req._ws_handled) {
        socket.destroy(new Error("Not found"))
      }
    })
  })
}

/**
 * Patch Express routers to handle web sockets and async routes (since we have
 * to patch `get` anyway).
 *
 * Not using express-ws since the ws-wrapped sockets don't work with the proxy
 * and wildcards don't work correctly.
 */
function patchRouter(): void {
  // Apparently this all works because Router is also the prototype assigned to
  // the routers it returns.

  // Store these since the original methods will be overridden.
  const originalGet = (express.Router as any).get
  const originalPost = (express.Router as any).post

  // Inject the `ws` method.
  ;(express.Router as any).ws = function ws(
    route: expressCore.PathParams,
    ...handlers: express.WebsocketRequestHandler[]
  ) {
    originalGet.apply(this, [
      route,
      ...handlers.map((handler) => {
        const wrapped: express.Handler = (req, _, next) => {
          if ((req as any).ws) {
            ;(req as any)._ws_handled = true
            Promise.resolve(handler((req as any).ws, (req as any).head, req, next)).catch(next)
          } else {
            next()
          }
        }
        return wrapped
      }),
    ])
    return this
  }
  // Overwrite `get` so we can distinguish between websocket and non-websocket
  // routes. While we're at it handle async responses.
  ;(express.Router as any).get = function get(route: expressCore.PathParams, ...handlers: express.Handler[]) {
    originalGet.apply(this, [
      route,
      ...handlers.map((handler) => {
        const wrapped: express.Handler = (req, res, next) => {
          if (!(req as any).ws) {
            Promise.resolve(handler(req, res, next)).catch(next)
          } else {
            next()
          }
        }
        return wrapped
      }),
    ])
    return this
  }
  // Handle async responses for `post` as well since we're in here anyway.
  ;(express.Router as any).post = function post(route: expressCore.PathParams, ...handlers: express.Handler[]) {
    originalPost.apply(this, [
      route,
      ...handlers.map((handler) => {
        const wrapped: express.Handler = (req, res, next) => {
          Promise.resolve(handler(req, res, next)).catch(next)
        }
        return wrapped
      }),
    ])
    return this
  }
}

// This needs to happen before anything uses the router.
patchRouter()
