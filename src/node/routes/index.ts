import { logger } from "@coder/logger"
import bodyParser from "body-parser"
import cookieParser from "cookie-parser"
import * as express from "express"
import { promises as fs } from "fs"
import http from "http"
import * as path from "path"
import * as tls from "tls"
import * as pluginapi from "../../../typings/pluginapi"
import { HttpCode, HttpError } from "../../common/http"
import { plural } from "../../common/util"
import { AuthType, DefaultedArgs } from "../cli"
import { rootPath } from "../constants"
import { Heart } from "../heart"
import { ensureAuthenticated, redirect, replaceTemplates } from "../http"
import { PluginAPI } from "../plugin"
import { getMediaMime, paths } from "../util"
import { wrapper } from "../wrapper"
import * as apps from "./apps"
import * as domainProxy from "./domainProxy"
import * as health from "./health"
import * as login from "./login"
import * as logout from "./logout"
import * as pathProxy from "./pathProxy"
// static is a reserved keyword.
import * as _static from "./static"
import * as update from "./update"
import * as vscode from "./vscode"

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
        logger.debug(plural(count, `${count} active connection`))
        resolve(count > 0)
      })
    })
  })
  server.on("close", () => {
    heart.dispose()
  })

  app.disable("x-powered-by")
  wsApp.disable("x-powered-by")

  app.use(cookieParser())
  wsApp.use(cookieParser())

  const common: express.RequestHandler = (req, _, next) => {
    // /healthz|/healthz/ needs to be excluded otherwise health checks will make
    // it look like code-server is always in use.
    if (!/^\/healthz\/?$/.test(req.url)) {
      heart.beat()
    }

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

  app.all("/proxy/(:port)(/*)?", (req, res) => {
    pathProxy.proxy(req, res)
  })
  wsApp.get("/proxy/(:port)(/*)?", async (req) => {
    await pathProxy.wsProxy(req as pluginapi.WebsocketRequest)
  })
  // These two routes pass through the path directly.
  // So the proxied app must be aware it is running
  // under /absproxy/<someport>/
  app.all("/absproxy/(:port)(/*)?", (req, res) => {
    pathProxy.proxy(req, res, {
      passthroughPath: true,
    })
  })
  wsApp.get("/absproxy/(:port)(/*)?", async (req) => {
    await pathProxy.wsProxy(req as pluginapi.WebsocketRequest, {
      passthroughPath: true,
    })
  })

  if (!process.env.CS_DISABLE_PLUGINS) {
    const workingDir = args._ && args._.length > 0 ? path.resolve(args._[args._.length - 1]) : undefined
    const pluginApi = new PluginAPI(logger, process.env.CS_PLUGIN, process.env.CS_PLUGIN_PATH, workingDir)
    await pluginApi.loadPlugins()
    pluginApi.mount(app, wsApp)
    app.use("/api/applications", ensureAuthenticated, apps.router(pluginApi))
    wrapper.onDispose(() => pluginApi.dispose())
  }

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))

  app.use("/", vscode.router)
  wsApp.use("/", vscode.wsRouter.router)
  app.use("/vscode", vscode.router)
  wsApp.use("/vscode", vscode.wsRouter.router)

  app.use("/healthz", health.router)
  wsApp.use("/healthz", health.wsRouter.router)

  if (args.auth === AuthType.Password) {
    app.use("/login", login.router)
    app.use("/logout", logout.router)
  } else {
    app.all("/login", (req, res) => redirect(req, res, "/", {}))
    app.all("/logout", (req, res) => redirect(req, res, "/", {}))
  }

  app.use("/static", _static.router)
  app.use("/update", update.router)

  app.use(() => {
    throw new HttpError("Not Found", HttpCode.NotFound)
  })

  const errorHandler: express.ErrorRequestHandler = async (err, req, res, next) => {
    if (err.code === "ENOENT" || err.code === "EISDIR") {
      err.status = HttpCode.NotFound
    }

    const status = err.status ?? err.statusCode ?? 500
    res.status(status)

    // Assume anything that explicitly accepts text/html is a user browsing a
    // page (as opposed to an xhr request). Don't use `req.accepts()` since
    // *every* request that I've seen (in Firefox and Chromium at least)
    // includes `*/*` making it always truthy. Even for css/javascript.
    if (req.headers.accept && req.headers.accept.includes("text/html")) {
      const resourcePath = path.resolve(rootPath, "src/browser/pages/error.html")
      res.set("Content-Type", getMediaMime(resourcePath))
      const content = await fs.readFile(resourcePath, "utf8")
      res.send(
        replaceTemplates(req, content)
          .replace(/{{ERROR_TITLE}}/g, status)
          .replace(/{{ERROR_HEADER}}/g, status)
          .replace(/{{ERROR_BODY}}/g, err.message),
      )
    } else {
      res.json({
        error: err.message,
        ...(err.details || {}),
      })
    }
  }

  app.use(errorHandler)

  const wsErrorHandler: express.ErrorRequestHandler = async (err, req, res, next) => {
    logger.error(`${err.message} ${err.stack}`)
    ;(req as pluginapi.WebsocketRequest).ws.end()
  }

  wsApp.use(wsErrorHandler)
}
