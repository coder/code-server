import { logger } from "@coder/logger"
import bodyParser from "body-parser"
import cookieParser from "cookie-parser"
import * as express from "express"
import { promises as fs } from "fs"
import http from "http"
import * as path from "path"
import * as tls from "tls"
import { HttpCode, HttpError } from "../../common/http"
import { plural } from "../../common/util"
import { AuthType, DefaultedArgs } from "../cli"
import { rootPath } from "../constants"
import { Heart } from "../heart"
import { replaceTemplates } from "../http"
import { loadPlugins } from "../plugin"
import * as domainProxy from "../proxy"
import { getMediaMime, paths } from "../util"
import { WebsocketRequest } from "../wsRouter"
import * as health from "./health"
import * as login from "./login"
import * as proxy from "./proxy"
// static is a reserved keyword.
import * as _static from "./static"
import * as update from "./update"
import * as vscode from "./vscode"

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    export interface Request {
      args: DefaultedArgs
      heart: Heart
    }
  }
}

/**
 * Register all routes and middleware.
 */
export const register = async (
  app: express.Express,
  wsApp: express.Express,
  server: http.Server,
  args: DefaultedArgs,
): Promise<void> => {
  const heart = new Heart(path.join(paths.data, "heartbeat"), async () => {
    return new Promise((resolve, reject) => {
      server.getConnections((error, count) => {
        if (error) {
          return reject(error)
        }
        logger.trace(plural(count, `${count} active connection`))
        resolve(count > 0)
      })
    })
  })

  app.disable("x-powered-by")
  wsApp.disable("x-powered-by")

  app.use(cookieParser())
  wsApp.use(cookieParser())

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))

  const common: express.RequestHandler = (req, _, next) => {
    heart.beat()

    // Add common variables routes can use.
    req.args = args
    req.heart = heart

    next()
  }

  app.use(common)
  wsApp.use(common)

  app.use(async (req, res, next) => {
    // If we're handling TLS ensure all requests are redirected to HTTPS.
    // TODO: This does *NOT* work if you have a base path since to specify the
    // protocol we need to specify the whole path.
    if (args.cert && !(req.connection as tls.TLSSocket).encrypted) {
      return res.redirect(`https://${req.headers.host}${req.originalUrl}`)
    }

    // Return robots.txt.
    if (req.originalUrl === "/robots.txt") {
      const resourcePath = path.resolve(rootPath, "src/browser/robots.txt")
      res.set("Content-Type", getMediaMime(resourcePath))
      return res.send(await fs.readFile(resourcePath))
    }

    next()
  })

  app.use("/", domainProxy.router)
  wsApp.use("/", domainProxy.wsRouter.router)

  app.use("/", vscode.router)
  wsApp.use("/", vscode.wsRouter.router)
  app.use("/vscode", vscode.router)
  wsApp.use("/vscode", vscode.wsRouter.router)

  app.use("/healthz", health.router)

  if (args.auth === AuthType.Password) {
    app.use("/login", login.router)
  }

  app.use("/proxy", proxy.router)
  wsApp.use("/proxy", proxy.wsRouter.router)

  app.use("/static", _static.router)
  app.use("/update", update.router)

  await loadPlugins(app, args)

  app.use(() => {
    throw new HttpError("Not Found", HttpCode.NotFound)
  })

  const errorHandler: express.ErrorRequestHandler = async (err, req, res) => {
    if (err.code === "ENOENT" || err.code === "EISDIR") {
      err.status = HttpCode.NotFound
    }

    const status = err.status ?? err.statusCode ?? 500
    res.status(status)

    if (req.accepts("application/json")) {
      res.json({
        error: err.message,
        ...(err.details || {}),
      })
    } else {
      const resourcePath = path.resolve(rootPath, "src/browser/pages/error.html")
      res.set("Content-Type", getMediaMime(resourcePath))
      const content = await fs.readFile(resourcePath, "utf8")
      res.send(
        replaceTemplates(req, content)
          .replace(/{{ERROR_TITLE}}/g, status)
          .replace(/{{ERROR_HEADER}}/g, status)
          .replace(/{{ERROR_BODY}}/g, err.message),
      )
    }
  }

  app.use(errorHandler)

  const wsErrorHandler: express.ErrorRequestHandler = async (err, req) => {
    logger.error(`${err.message} ${err.stack}`)
    ;(req as WebsocketRequest).ws.destroy(err)
  }

  wsApp.use(wsErrorHandler)
}
