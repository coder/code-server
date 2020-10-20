import { Request, Router } from "express"
import qs from "qs"
import { HttpCode, HttpError } from "../../common/http"
import { authenticated, redirect } from "../http"
import { proxy } from "../proxy"

export const router = Router()

const getProxyTarget = (req: Request, rewrite: boolean): string => {
  if (rewrite) {
    const query = qs.stringify(req.query)
    return `http://127.0.0.1:${req.params.port}/${req.params[0] || ""}${query ? `?${query}` : ""}`
  }
  return `http://127.0.0.1:${req.params.port}/${req.originalUrl}`
}

router.all("/(:port)(/*)?", (req, res) => {
  if (!authenticated(req)) {
    // If visiting the root (/proxy/:port and nothing else) redirect to the
    // login page.
    if (!req.params[0] || req.params[0] === "/") {
      return redirect(req, res, "login", {
        to: `${req.baseUrl}${req.path}` || "/",
      })
    }
    throw new HttpError("Unauthorized", HttpCode.Unauthorized)
  }

  // Absolute redirects need to be based on the subpath when rewriting.
  ;(req as any).base = `${req.baseUrl}/${req.params.port}`

  proxy.web(req, res, {
    ignorePath: true,
    target: getProxyTarget(req, true),
  })
})

router.ws("/(:port)(/*)?", (socket, head, req) => {
  proxy.ws(req, socket, head, {
    ignorePath: true,
    target: getProxyTarget(req, true),
  })
})
