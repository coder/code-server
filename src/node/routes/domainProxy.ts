import { Request, Router } from "express"
import { HttpCode, HttpError } from "../../common/http"
import { authenticated, ensureAuthenticated, ensureOrigin, redirect, self } from "../http"
import { proxy } from "../proxy"
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
  const parts = domain.split(".")

  // There must be an exact match for proxy-domain
  const port = parts.shift()
  const proxyDomain = parts.join(".")
  if (port && req.args["proxy-domain"].includes(proxyDomain)) {
    return port
  }

  // check based on VSCODE_PROXY_URI
  const proxyTemplate = process.env.VSCODE_PROXY_URI
  if(proxyTemplate) {
    return matchVsCodeProxyUriAndExtractPort(proxyTemplate, domain)
  }
  
  return undefined
}


let regex : RegExp | undefined = undefined;
const matchVsCodeProxyUriAndExtractPort = (matchString: string, domain: string): string | undefined => {
  // init regex on first use
  if(!regex) {
    // Escape dot characters in the match string
    let escapedMatchString = matchString.replace(/\./g, "\\.");

    // Replace {{port}} with a regex group to capture the port
    let regexString = escapedMatchString.replace("{{port}}", "(\\d+)");

    // remove http:// and https:// from matchString as protocol cannot be determined based on the Host header
    regexString = regexString.replace("https://", "").replace("http://", "");

    // Replace {{host}} with .* to allow any host match (so rely on DNS record here)
    regexString = regexString.replace("{{host}}", ".*");

    regex = new RegExp("^" + regexString + "$");
  }
  
  // Test the domain against the regex
  let match = domain.match(regex);

  if (match) {
    return match[1]; // match[1] contains the port
  }

  return undefined;
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
