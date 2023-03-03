import { Request, Response } from "express"
import * as path from "path"
import * as qs from "qs"
import * as pluginapi from "../../../typings/pluginapi"
import { HttpCode, HttpError } from "../../common/http"
import { authenticated, ensureAuthenticated, ensureOrigin, redirect, self } from "../http"
import { proxy as _proxy } from "../proxy"

const getProxyTarget = (req: Request, passthroughPath?: boolean): string => {
  if (passthroughPath) {
    return `http://0.0.0.0:${req.params.port}/${req.originalUrl}`
  }
  const query = qs.stringify(req.query)
  return `http://0.0.0.0:${req.params.port}/${req.params[0] || ""}${query ? `?${query}` : ""}`
}

export async function proxy(
  req: Request,
  res: Response,
  opts?: {
    passthroughPath?: boolean
  },
): Promise<void> {
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

  if (!opts?.passthroughPath) {
    // Absolute redirects need to be based on the subpath when rewriting.
    // See proxy.ts.
    ;(req as any).base = req.path.split(path.sep).slice(0, 3).join(path.sep)
  }

  _proxy.web(req, res, {
    ignorePath: true,
    target: getProxyTarget(req, opts?.passthroughPath),
  })
}

export async function wsProxy(
  req: pluginapi.WebsocketRequest,
  opts?: {
    passthroughPath?: boolean
  },
): Promise<void> {
  ensureOrigin(req)
  await ensureAuthenticated(req)
  _proxy.ws(req, req.ws, req.head, {
    ignorePath: true,
    target: getProxyTarget(req, opts?.passthroughPath),
  })
}
