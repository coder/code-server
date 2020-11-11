import { Request, Router } from "express"
import qs from "qs"
import { HttpCode, HttpError } from "../../common/http"
import { normalize } from "../../common/util"
import { authenticated, ensureAuthenticated, redirect } from "../http"
import { proxy } from "../proxy"
import { Router as WsRouter } from "../wsRouter"

export const router = Router()

const getProxyTarget = (req: Request, rewrite: boolean): string => {
  if (rewrite) {
    const query = qs.stringify(req.query)
    return `http://0.0.0.0:${req.params.port}/${req.params[0] || ""}${query ? `?${query}` : ""}`
  }
  return `http://0.0.0.0:${req.params.port}/${req.originalUrl}`
}

router.all("/(:port)(/*)?", (req, res) => {
  if (!authenticated(req)) {
    // If visiting the root (/:port only) redirect to the login page.
    if (!req.params[0] || req.params[0] === "/") {
      const to = normalize(`${req.baseUrl}${req.path}`)
      return redirect(req, res, "login", {
        to: to !== "/" ? to : undefined,
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

export const wsRouter = WsRouter()

wsRouter.ws("/(:port)(/*)?", ensureAuthenticated, (req) => {
  proxy.ws(req, req.ws, req.head, {
    ignorePath: true,
    target: getProxyTarget(req, true),
  })
})
