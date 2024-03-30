import { Request, Response } from "express"
import * as path from "path"
import * as pluginapi from "../../../typings/pluginapi"
import { HttpCode, HttpError } from "../../common/http"
import { ensureProxyEnabled, authenticated, ensureAuthenticated, ensureOrigin, redirect, self } from "../http"
import { proxy as _proxy } from "../proxy"

const getProxyTarget = (req: Request): string => {
  // If there is a base path, strip it out.
  const base = (req as any).base || ""
  return `http://0.0.0.0:${req.params.port}/${req.originalUrl.slice(base.length)}`
}

export async function proxy(
  req: Request,
  res: Response,
  opts?: {
    passthroughPath?: boolean
  },
): Promise<void> {
  ensureProxyEnabled(req)

  if (!(await authenticated(req))) {
    // If visiting the root (/:port only) redirect to the login page.
    if (!req.params[0] || req.params[0] === "/") {
      const to = self(req)
      return redirect(req, res, "login", {
        to: to !== "/" ? to : undefined,
      })
    }
    throw new HttpError("Unauthorized", HttpCode.Unauthorized)
  }

  // The base is used for rewriting (redirects, target).
  if (!opts?.passthroughPath) {
    ;(req as any).base = req.path.split(path.sep).slice(0, 3).join(path.sep)
  }

  _proxy.web(req, res, {
    ignorePath: true,
    target: getProxyTarget(req),
  })
}

export async function wsProxy(
  req: pluginapi.WebsocketRequest,
  opts?: {
    passthroughPath?: boolean
  },
): Promise<void> {
  ensureProxyEnabled(req)
  ensureOrigin(req)
  await ensureAuthenticated(req)

  // The base is used for rewriting (redirects, target).
  if (!opts?.passthroughPath) {
    ;(req as any).base = req.path.split(path.sep).slice(0, 3).join(path.sep)
  }

  _proxy.ws(req, req.ws, req.head, {
    ignorePath: true,
    target: getProxyTarget(req),
  })
}
