import { field, logger } from "@coder/logger"
import * as express from "express"
import * as expressCore from "express-serve-static-core"
import qs from "qs"
import safeCompare from "safe-compare"
import { HttpCode, HttpError } from "../common/http"
import { normalize, Options } from "../common/util"
import { AuthType } from "./cli"
import { hash } from "./util"

export interface CommonTemplateVars extends Options {
  coderOptions: Options
}

export const commonTemplateVars = <T extends Options>(
  req: express.Request,
  extraOpts?: Omit<T, "base" | "logLevel">,
): CommonTemplateVars => {
  const base = relativeRoot(req)
  const coderOptions: Options = {
    base,
    logLevel: logger.level,
    ...extraOpts,
  }

  return {
    ...coderOptions,
    coderOptions,
  }
}

/**
 * Throw an error if not authorized. Call `next` if provided.
 */
export const ensureAuthenticated = (req: express.Request, _?: express.Response, next?: express.NextFunction): void => {
  if (!authenticated(req)) {
    throw new HttpError("Unauthorized", HttpCode.Unauthorized)
  }
  if (next) {
    next()
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
  return host || undefined
}
