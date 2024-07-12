import { Request, Router } from "express"
import { HttpCode, HttpError } from "../../common/http"
import { getHost, ensureProxyEnabled, authenticated, ensureAuthenticated, ensureOrigin, redirect, self } from "../http"
import { proxy } from "../proxy"
import { Router as WsRouter } from "../wsRouter"

export const router = Router()

const proxyDomainToRegex = (matchString: string): RegExp => {
  const escapedMatchString = matchString.replace(/[.*+?^$()|[\]\\]/g, "\\$&")

  // Replace {{port}} with a regex group to capture the port
  // Replace {{host}} with .+ to allow any host match (so rely on DNS record here)
  let regexString = escapedMatchString.replace("{{port}}", "(\\d+)")
  regexString = regexString.replace("{{host}}", ".+")

  regexString = regexString.replace(/[{}]/g, "\\$&") //replace any '{}' that might be left

  return new RegExp("^" + regexString + "$")
}

let proxyRegexes: RegExp[] = []
const proxyDomainsToRegex = (proxyDomains: string[]): RegExp[] => {
  if (proxyDomains.length !== proxyRegexes.length) {
    proxyRegexes = proxyDomains.map(proxyDomainToRegex)
  }
  return proxyRegexes
}

/**
 * Return the port if the request should be proxied.
 *
 * The proxy-domain should be of format anyprefix-{{port}}-anysuffix.{{host}}, where {{host}} is optional
 * e.g. code-8080.domain.tld would match for code-{{port}}.domain.tld and code-{{port}}.{{host}}.
 *
 */
const maybeProxy = (req: Request): string | undefined => {
  const reqDomain = getHost(req)
  if (reqDomain === undefined) {
    return undefined
  }

  const regexs = proxyDomainsToRegex(req.args["proxy-domain"])

  for (const regex of regexs) {
    const match = reqDomain.match(regex)

    if (match) {
      return match[1] // match[1] contains the port
    }
  }

  return undefined
}

router.all(/.*/, async (req, res, next) => {
  const port = maybeProxy(req)
  if (!port) {
    return next()
  }

  ensureProxyEnabled(req)

  // Must be authenticated to use the proxy.
  const isAuthenticated = await authenticated(req)
  if (!isAuthenticated) {
    // Let the assets through since they're used on the login page.
    if (req.path.startsWith("/_static/") && req.method === "GET") {
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
      const to = self(req)
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

wsRouter.ws(/.*/, async (req, _, next) => {
  const port = maybeProxy(req)
  if (!port) {
    return next()
  }

  ensureProxyEnabled(req)
  ensureOrigin(req)
  await ensureAuthenticated(req)
  proxy.ws(req, req.ws, req.head, {
    ignorePath: true,
    target: `http://0.0.0.0:${port}${req.originalUrl}`,
  })
})
