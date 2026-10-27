import { field, logger } from "@coder/logger"
import * as express from "express"
import * as http from "http"
import * as net from "net"
import qs from "qs"
import { Disposable } from "../common/emitter"
import { HttpCode, HttpError } from "../common/http"
import { normalize } from "../common/util"
import { AuthType, DefaultedArgs } from "./cli"
import { version as codeServerVersion } from "./constants"
import { Heart } from "./heart"
import { CoderSettings, SettingsProvider } from "./settings"
import { UpdateProvider } from "./update"
import {
  getPasswordMethod,
  IsCookieValidArgs,
  isCookieValid,
  sanitizeString,
  escapeHtml,
  escapeJSON,
  splitOnFirstEquals,
} from "./util"

/**
 * Base options included on every page.
 */
export interface ClientConfiguration {
  codeServerVersion: string
  /** Relative path from this page to the root.  No trailing slash. */
  base: string
  /** Relative path from this page to the static root.  No trailing slash. */
  csStaticBase: string
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    export interface Request {
      args: DefaultedArgs
      heart: Heart
      settings: SettingsProvider<CoderSettings>
      updater: UpdateProvider
      cookieSessionName: string
    }
  }
}

export const createClientConfiguration = (req: express.Request): ClientConfiguration => {
  const base = relativeRoot(req.originalUrl)

  return {
    base,
    csStaticBase: base + "/_static",
    codeServerVersion,
  }
}

/**
 * Replace common variable strings in HTML templates.
 */
export const replaceTemplates = <T extends object>(
  req: express.Request,
  content: string,
  extraOpts?: Omit<T, "base" | "csStaticBase" | "logLevel">,
): string => {
  const serverOptions: ClientConfiguration = {
    ...createClientConfiguration(req),
    ...extraOpts,
  }

  return content
    .replace(/{{TO}}/g, (typeof req.query.to === "string" && escapeHtml(req.query.to)) || "/")
    .replace(/{{BASE}}/g, serverOptions.base)
    .replace(/{{CS_STATIC_BASE}}/g, serverOptions.csStaticBase)
    .replace("{{OPTIONS}}", () => escapeJSON(serverOptions))
}

/**
 * Throw an error if proxy is not enabled. Call `next` if provided.
 */
export const ensureProxyEnabled = (req: express.Request, _?: express.Response, next?: express.NextFunction): void => {
  if (!proxyEnabled(req)) {
    throw new HttpError("Forbidden", HttpCode.Forbidden)
  }
  if (next) {
    next()
  }
}

/**
 * Return true if proxy is enabled.
 */
export const proxyEnabled = (req: express.Request): boolean => {
  return !req.args["disable-proxy"]
}

/**
 * Throw an error if not authorized. Call `next` if provided.
 */
export const ensureAuthenticated = async (
  req: express.Request,
  _?: express.Response,
  next?: express.NextFunction,
): Promise<void> => {
  const isAuthenticated = await authenticated(req)
  if (!isAuthenticated) {
    throw new HttpError("Unauthorized", HttpCode.Unauthorized)
  }
  if (next) {
    next()
  }
}

/**
 * Return true if authenticated via cookies.
 */
export const authenticated = async (req: express.Request): Promise<boolean> => {
  switch (req.args.auth) {
    case AuthType.None: {
      return true
    }
    case AuthType.Password: {
      // The password is stored in the cookie after being hashed.
      const hashedPasswordFromArgs = req.args["hashed-password"]
      const passwordMethod = getPasswordMethod(hashedPasswordFromArgs)
      const isCookieValidArgs: IsCookieValidArgs = {
        passwordMethod,
        cookieKey: sanitizeString(req.cookies[req.cookieSessionName]),
        passwordFromArgs: req.args.password || "",
        hashedPasswordFromArgs: req.args["hashed-password"],
      }

      return await isCookieValid(isCookieValidArgs)
    }
    default: {
      throw new Error(`Unsupported auth type ${req.args.auth}`)
    }
  }
}

/**
 * Get the relative path that will get us to the root of the page. For each
 * slash we need to go up a directory.  Will not have a trailing slash.
 *
 * For example:
 *
 * / => .
 * /foo => .
 * /foo/ => ./..
 * /foo/bar => ./..
 * /foo/bar/ => ./../..
 *
 * All paths must be relative in order to work behind a reverse proxy since we
 * we do not know the base path.  Anything that needs to be absolute (for
 * example cookies) must get the base path from the frontend.
 *
 * All relative paths must be prefixed with the relative root to ensure they
 * work no matter the depth at which they happen to appear.
 *
 * For Express `req.originalUrl` should be used as they remove the base from the
 * standard `url` property making it impossible to get the true depth.
 */
export const relativeRoot = (originalUrl: string): string => {
  const depth = (originalUrl.split("?", 1)[0].match(/\//g) || []).length
  return normalize("./" + (depth > 1 ? "../".repeat(depth - 1) : ""))
}

/**
 * A helper function to construct a redirect path based on
 * an Express Request, query and a path to redirect to.
 *
 * Redirect path is relative to `/${to}`.
 */
export const constructRedirectPath = (req: express.Request, query: qs.ParsedQs, to: string): string => {
  const relativePath = normalize(`${relativeRoot(req.originalUrl)}/${to}`, true)
  // %2f or %2F are both equalivent to an encoded slash /
  const queryString = qs.stringify(query).replace(/%2[fF]/g, "/")
  const redirectPath = `${relativePath}${queryString ? `?${queryString}` : ""}`

  return redirectPath
}

/**
 * Redirect relatively to `/${to}`. Query variables on the current URI will be
 * preserved.  `to` should be a simple path without any query parameters
 * `override` will merge with the existing query (use `undefined` to unset).
 */
export const redirect = (req: express.Request, res: express.Response, to: string, override: qs.ParsedQs = {}): void => {
  const query = Object.assign({}, req.query, override)
  Object.keys(override).forEach((key) => {
    if (typeof override[key] === "undefined") {
      delete query[key]
    }
  })

  const redirectPath = constructRedirectPath(req, query, to)
  logger.debug(`redirecting from ${req.originalUrl} to ${redirectPath}`)
  res.redirect(redirectPath)
}

/**
 * Get the value that should be used for setting a cookie domain. This will
 * allow the user to authenticate once no matter what sub-domain they use to log
 * in. This will use the highest level proxy domain (e.g. `coder.com` over
 * `test.coder.com` if both are specified).
 */
export const getCookieDomain = (host: string, proxyDomains: string[]): string | undefined => {
  const idx = host.lastIndexOf(":")
  host = idx !== -1 ? host.substring(0, idx) : host
  // If any of these are true we will still set cookies but without an explicit
  // `Domain` attribute on the cookie.
  if (
    // The host can be be blank or missing so there's nothing we can set.
    !host ||
    // IP addresses can't have subdomains so there's no value in setting the
    // domain for them. Assume that anything with a : is ipv6 (valid domain name
    // characters are alphanumeric or dashes)...
    host.includes(":") ||
    // ...and that anything entirely numbers and dots is ipv4 (currently tlds
    // cannot be entirely numbers).
    !/[^0-9.]/.test(host) ||
    // localhost subdomains don't seem to work at all (browser bug?). A cookie
    // set at dev.localhost cannot be read by 8080.dev.localhost.
    host.endsWith(".localhost") ||
    // Domains without at least one dot (technically two since domain.tld will
    // become .domain.tld) are considered invalid according to the spec so don't
    // set the domain for them. In my testing though localhost is the only
    // problem (the browser just doesn't store the cookie at all). localhost has
    // an additional problem which is that a reverse proxy might give
    // code-server localhost even though the domain is really domain.tld (by
    // default NGINX does this).
    !host.includes(".")
  ) {
    logger.debug("no valid cookie domain", field("host", host))
    return undefined
  }

  proxyDomains.forEach((proxyDomain) => {
    // Proxy domains are patterns like `{{port}}.domain.tld` or
    // `prefix-{{port}}-suffix.domain.tld` so use the part after the label that
    // contains the port.
    const portIndex = proxyDomain.indexOf("{{port}}")
    const domain = portIndex === -1 ? proxyDomain : proxyDomain.substring(proxyDomain.indexOf(".", portIndex) + 1)
    // Skip patterns we cannot turn into a domain, like `{{port}}.{{host}}`.
    if (!domain || domain.includes("{{")) {
      return
    }
    if (host.endsWith(domain) && domain.length < host.length) {
      host = domain
    }
  })

  logger.debug("got cookie domain", field("host", host))
  return host || undefined
}

/**
 * Return a function capable of fully disposing an HTTP server.
 */
export function disposer(server: http.Server): Disposable["dispose"] {
  const sockets = new Set<net.Socket>()
  let cleanupTimeout: undefined | NodeJS.Timeout

  server.on("connection", (socket) => {
    sockets.add(socket)

    socket.on("close", () => {
      sockets.delete(socket)

      if (cleanupTimeout && sockets.size === 0) {
        clearTimeout(cleanupTimeout)
        cleanupTimeout = undefined
      }
    })
  })

  return () => {
    return new Promise<void>((resolve, reject) => {
      // The whole reason we need this disposer is because close will not
      // actually close anything; it only prevents future connections then waits
      // until everything is closed.
      server.close((err) => {
        if (err) {
          return reject(err)
        }

        resolve()
      })

      // If there are sockets remaining we might need to force close them or
      // this promise might never resolve.
      if (sockets.size > 0) {
        // Give sockets a chance to close up shop.
        cleanupTimeout = setTimeout(() => {
          cleanupTimeout = undefined

          for (const socket of sockets.values()) {
            console.warn("a socket was left hanging")
            socket.destroy()
          }
        }, 1000)
      }
    })
  }
}

/**
 * Get the options for setting a cookie.  The options must be identical for
 * setting and unsetting cookies otherwise they are considered separate.
 */
export const getCookieOptions = (req: express.Request): express.CookieOptions => {
  // Normally we set paths relatively.  However browsers do not appear to allow
  // cookies to be set relatively which means we need an absolute path.  We
  // cannot be guaranteed we know the path since a reverse proxy might have
  // rewritten it.  That means we need to get the path from the frontend.

  // The reason we need to set the path (as opposed to defaulting to /) is to
  // avoid code-server instances on different sub-paths clobbering each other or
  // from accessing each other's tokens (and to prevent other services from
  // accessing code-server's tokens).

  // When logging in or out the request must include the href (the full current
  // URL of that page) and the relative path to the root as given to it by the
  // backend.  Using these two we can determine the true absolute root.
  const url = new URL(
    req.query.base || req.body?.base || "/",
    req.query.href || req.body?.href || "http://" + (req.headers.host || "localhost"),
  )
  return {
    domain: getCookieDomain(url.host, req.args["proxy-domain"]),
    path: normalize(url.pathname) || "/",
    sameSite: "lax",
  }
}

/**
 * Return the full path to the current page, preserving any trailing slash.
 */
export const self = (req: express.Request): string => {
  return normalize(`${req.baseUrl}${req.originalUrl.endsWith("/") ? "/" : ""}`, true)
}

function getFirstHeader(req: http.IncomingMessage, headerName: string): string | undefined {
  const val = req.headers[headerName]
  return Array.isArray(val) ? val[0] : val
}

/**
 * Throw a forbidden error if origin checks fail. Call `next` if provided.
 */
export function ensureOrigin(req: express.Request, _?: express.Response, next?: express.NextFunction): void {
  try {
    authenticateOrigin(req)
    if (next) {
      next()
    }
  } catch (error) {
    logger.debug(`${error instanceof Error ? error.message : error}; blocking request to ${req.originalUrl}`)
    throw new HttpError("Forbidden", HttpCode.Forbidden)
  }
}

/**
 * Return true if the origin matches any trusted origin.  Entries are matched
 * as exact strings, the special wildcard `"*"`, or `*.example.com`-style
 * domain wildcards (same as --proxy-domain).
 */
export function isTrustedOrigin(origin: string, trustedOrigins: string[]): boolean {
  return trustedOrigins.some((trusted) => {
    if (trusted === "*" || trusted === origin) {
      return true
    }
    // *.example.com style: match origin if it is the domain or a subdomain
    if (trusted.startsWith("*.")) {
      const domain = trusted.slice(2).toLowerCase()
      return origin === domain || origin.endsWith("." + domain)
    }
    return false
  })
}

/**
 * Authenticate the request origin against the host.  Throw if invalid.
 */
export function authenticateOrigin(req: express.Request): void {
  // A missing origin probably means the source is non-browser.  Not sure we
  // have a use case for this but let it through.
  const originRaw = getFirstHeader(req, "origin")
  if (!originRaw) {
    return
  }

  let originUrl: URL
  try {
    originUrl = new URL(originRaw)
  } catch (error) {
    throw new Error(`unable to parse malformed origin "${originRaw}"`)
  }
  const origin = originUrl.host.trim().toLowerCase()

  const trustedOrigins = req.args["trusted-origins"] || []
  if (isTrustedOrigin(origin, trustedOrigins)) {
    return
  }

  const host = getHost(req, true)
  if (typeof host === "undefined") {
    // A missing host likely means the reverse proxy has not been configured to
    // forward the host which means we cannot perform the check.  Emit an error
    // so an admin can fix the issue.
    logger.error("No host headers found")
    logger.error("Are you behind a reverse proxy that does not forward the host?")
    throw new Error("no host headers found")
  }

  if (!hostMatchesOrigin(host, originUrl)) {
    throw new Error(`host "${host}" does not match origin "${origin}"`)
  }
}

const defaultPorts: { [protocol: string]: string } = {
  "http:": "80",
  "https:": "443",
}

/**
 * Parse a host like `example.com:8080` or `[::1]:8080`.  A non-special scheme
 * keeps the port as written instead of dropping default ports.
 */
function parseHost(host: string): URL | undefined {
  try {
    return new URL(`host://${host}`)
  } catch (error) {
    return undefined
  }
}

/**
 * Check whether the host from the request headers matches the origin.
 *
 * This is an exact match, except that a default port (80 for http, 443 for
 * https) is the same as no port, since `example.com:443` and
 * `https://example.com` are the same origin.
 */
export function hostMatchesOrigin(host: string, origin: URL): boolean {
  const parsed = parseHost(host)
  if (!parsed) {
    return false
  }
  const port = parsed.port === defaultPorts[origin.protocol] ? "" : parsed.port
  return parsed.hostname === origin.hostname.toLowerCase() && port === origin.port
}

/**
 * Add the port from X-Forwarded-Port to a host that does not have one.  Some
 * reverse proxies (for example nginx with `$host`) forward the host without
 * the port and send the port separately.
 */
function addForwardedPort(req: express.Request, host: string): string {
  const port = getFirstHeader(req, "x-forwarded-port")?.split(",")[0].trim()
  if (!port || !/^\d+$/.test(port) || parseHost(host)?.port !== "") {
    return host
  }
  return `${host}:${port}`
}

/**
 * Get the host from headers.  It will be trimmed and lowercased.
 *
 * If `withForwardedPort` is set and the host comes from X-Forwarded-Host
 * without a port, the port from X-Forwarded-Port is added.
 */
export function getHost(req: express.Request, withForwardedPort = false): string | undefined {
  // Honor Forwarded if present.
  const forwardedRaw = getFirstHeader(req, "forwarded")
  if (forwardedRaw) {
    const parts = forwardedRaw.split(/[;,]/)
    for (let i = 0; i < parts.length; ++i) {
      const [key, value] = splitOnFirstEquals(parts[i])
      if (key.trim().toLowerCase() === "host" && value) {
        return value.trim().toLowerCase()
      }
    }
  }

  // Honor X-Forwarded-Host if present.  Some reverse proxies will set multiple
  // comma-separated hosts.
  const xHost = getFirstHeader(req, "x-forwarded-host")
  if (xHost) {
    const firstXHost = xHost.split(",")[0]
    if (firstXHost) {
      const host = firstXHost.trim().toLowerCase()
      return withForwardedPort ? addForwardedPort(req, host) : host
    }
  }

  const host = getFirstHeader(req, "host")
  return host ? host.trim().toLowerCase() : undefined
}
