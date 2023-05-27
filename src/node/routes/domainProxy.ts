import { Request, Router } from "express"
import { HttpCode, HttpError } from "../../common/http"
import { getHost } from "../http"
import { authenticated, ensureAuthenticated, ensureOrigin, redirect, self } from "../http"
import { proxy } from "../proxy"
import { Router as WsRouter } from "../wsRouter"

export const router = Router()

const proxyDomainToRegex = (matchString: string): RegExp => {
  let escapedMatchString = matchString.replace(/[.*+?^$()|[\]\\]/g, "\\$&");

  // Replace {{port}} with a regex group to capture the port
  // Replace {{host}} with .+ to allow any host match (so rely on DNS record here)
  let regexString = escapedMatchString.replace("{{port}}", "(\\d+)");
  regexString = regexString.replace("{{host}}", ".+");

  regexString = regexString.replace(/[{}]/g, "\\$&"); //replace any '{}' that might be left

  return new RegExp("^" + regexString + "$");
}

let proxyRegexes : RegExp[] = [];
const proxyDomainsToRegex = (proxyDomains : string[]): RegExp[] => {
  if(proxyDomains.length != proxyRegexes.length) {
    proxyRegexes = proxyDomains.map(proxyDomainToRegex);
  }
  return proxyRegexes;
}

/**
 * Return the port if the request should be proxied. Anything that ends in a
 * proxy domain and has a *single* subdomain should be proxied. Anything else
 * should return `undefined` and will be handled as normal.
 *
 * For example if `coder.com` is specified `8080.coder.com` will be proxied
 * but `8080.test.coder.com` and `test.8080.coder.com` will not.
 */
const maybeProxy = (req: Request): string | undefined => {
  let reqDomain = getHost(req);
  if (reqDomain === undefined) {
    return undefined;
  }

  let regexs = proxyDomainsToRegex(req.args["proxy-domain"]);

  for(let regex of regexs){
    let match = reqDomain.match(regex);

    if (match) {
      return match[1]; // match[1] contains the port
    }
  }

  return undefined
}

router.all("*", async (req, res, next) => {
  const port = maybeProxy(req)
  if (!port) {
    return next()
  }

  // Must be authenticated to use the proxy.
  const isAuthenticated = await authenticated(req)
  if (!isAuthenticated) {
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

wsRouter.ws("*", async (req, _, next) => {
  const port = maybeProxy(req)
  if (!port) {
    return next()
  }
  ensureOrigin(req)
  await ensureAuthenticated(req)
  proxy.ws(req, req.ws, req.head, {
    ignorePath: true,
    target: `http://0.0.0.0:${port}${req.originalUrl}`,
  })
})
