import { logger } from "@coder/logger"
import cookieParser from "cookie-parser"
import * as express from "express"
import { promises as fs } from "fs"
import * as path from "path"
import * as tls from "tls"
import * as pluginapi from "../../../typings/pluginapi"
import { Disposable } from "../../common/emitter"
import { HttpCode, HttpError } from "../../common/http"
import { plural } from "../../common/util"
import { App } from "../app"
import { AuthType, DefaultedArgs } from "../cli"
import { commit, rootPath } from "../constants"
import { Heart } from "../heart"
import { ensureAuthenticated, redirect } from "../http"
import { PluginAPI } from "../plugin"
import { CoderSettings, SettingsProvider } from "../settings"
import { UpdateProvider } from "../update"
import { getMediaMime, paths } from "../util"
import * as apps from "./apps"
import * as domainProxy from "./domainProxy"
import { errorHandler, wsErrorHandler } from "./errors"
import * as health from "./health"
import * as login from "./login"
import * as logout from "./logout"
import * as pathProxy from "./pathProxy"
import * as update from "./update"
import * as vscode from "./vscode"

/**
 * Register all routes and middleware.
 */
export const register = async (app: App, args: DefaultedArgs): Promise<Disposable["dispose"]> => {
  const heart = new Heart(path.join(paths.data, "heartbeat"), async () => {
    return new Promise((resolve, reject) => {
      // getConnections appears to not call the callback when there are no more
      // connections.  Feels like it must be a bug?  For now add a timer to make
      // sure we eventually resolve.
      const timer = setTimeout(() => {
        logger.debug("Node failed to respond with connections; assuming zero")
        resolve(false)
      }, 5000)
      app.server.getConnections((error, count) => {
        clearTimeout(timer)
        if (error) {
          return reject(error)
        }
        logger.debug(plural(count, `${count} active connection`))
        resolve(count > 0)
      })
    })
  })

  app.router.disable("x-powered-by")
  app.wsRouter.disable("x-powered-by")

  app.router.use(cookieParser())
  app.wsRouter.use(cookieParser())

  const settings = new SettingsProvider<CoderSettings>(path.join(args["user-data-dir"], "coder.json"))
  const updater = new UpdateProvider("https://api.github.com/repos/coder/code-server/releases/latest", settings)

  const common: express.RequestHandler = (req, _, next) => {
    // /healthz|/healthz/ needs to be excluded otherwise health checks will make
    // it look like code-server is always in use.
    if (!/^\/healthz\/?$/.test(req.url)) {
      // NOTE@jsjoeio - intentionally not awaiting the .beat() call here because
      // we don't want to slow down the request.
      heart.beat()
    }

    // Add common variables routes can use.
    req.args = args
    req.heart = heart
    req.settings = settings
    req.updater = updater

    next()
  }

  app.router.use(common)
  app.wsRouter.use(common)

  app.router.use(async (req, res, next) => {
    // If we're handling TLS ensure all requests are redirected to HTTPS.
    // TODO: This does *NOT* work if you have a base path since to specify the
    // protocol we need to specify the whole path.
    if (args.cert && !(req.connection as tls.TLSSocket).encrypted) {
      return res.redirect(`https://${req.headers.host}${req.originalUrl}`)
    }

    // Return security.txt.
    if (req.originalUrl === "/security.txt" || req.originalUrl === "/.well-known/security.txt") {
      const resourcePath = path.resolve(rootPath, "src/browser/security.txt")
      res.set("Content-Type", getMediaMime(resourcePath))
      return res.send(await fs.readFile(resourcePath))
    }

    // Return robots.txt.
    if (req.originalUrl === "/robots.txt") {
      const resourcePath = path.resolve(rootPath, "src/browser/robots.txt")
      res.set("Content-Type", getMediaMime(resourcePath))
      return res.send(await fs.readFile(resourcePath))
    }

    next()
  })

  app.router.use("/", domainProxy.router)
  app.wsRouter.use("/", domainProxy.wsRouter.router)

  app.router.all("/proxy/:port/:path(.*)?", async (req, res) => {
    await pathProxy.proxy(req, res)
  })
  app.wsRouter.get("/proxy/:port/:path(.*)?", async (req) => {
    await pathProxy.wsProxy(req as pluginapi.WebsocketRequest)
  })
  // These two routes pass through the path directly.
  // So the proxied app must be aware it is running
  // under /absproxy/<someport>/
  app.router.all("/absproxy/:port/:path(.*)?", async (req, res) => {
    await pathProxy.proxy(req, res, {
      passthroughPath: true,
      proxyBasePath: args["abs-proxy-base-path"],
    })
  })
  app.wsRouter.get("/absproxy/:port/:path(.*)?", async (req) => {
    await pathProxy.wsProxy(req as pluginapi.WebsocketRequest, {
      passthroughPath: true,
      proxyBasePath: args["abs-proxy-base-path"],
    })
  })

  let pluginApi: PluginAPI
  if (!process.env.CS_DISABLE_PLUGINS) {
    const workingDir = args._ && args._.length > 0 ? path.resolve(args._[args._.length - 1]) : undefined
    pluginApi = new PluginAPI(logger, process.env.CS_PLUGIN, process.env.CS_PLUGIN_PATH, workingDir)
    await pluginApi.loadPlugins()
    pluginApi.mount(app.router, app.wsRouter)
    app.router.use("/api/applications", ensureAuthenticated, apps.router(pluginApi))
  }

  app.router.use(express.json())
  app.router.use(express.urlencoded({ extended: true }))

  app.router.use(
    "/_static",
    express.static(rootPath, {
      cacheControl: commit !== "development",
      fallthrough: false,
      setHeaders: (res, path, stat) => {
        // The service worker is served from a sub-path on the static route so
        // this is required to allow it to register a higher scope (by default
        // the browser only allows it to register from its own path or lower).
        if (path.endsWith("/serviceWorker.js")) {
          res.setHeader("Service-Worker-Allowed", "/")
        }
      },
    }),
  )

  app.router.use("/healthz", health.router)
  app.wsRouter.use("/healthz", health.wsRouter.router)

  if (args.auth === AuthType.Password) {
    app.router.use("/login", login.router)
    app.router.use("/logout", logout.router)
  } else {
    app.router.all("/login", (req, res) => redirect(req, res, "/", {}))
    app.router.all("/logout", (req, res) => redirect(req, res, "/", {}))
  }

  app.router.use("/update", update.router)

  // Note that the root route is replaced in Coder Enterprise by the plugin API.
  for (const routePrefix of ["/vscode", "/"]) {
    app.router.use(routePrefix, vscode.router)
    app.wsRouter.use(routePrefix, vscode.wsRouter.router)
  }

  app.router.use(() => {
    throw new HttpError("Not Found", HttpCode.NotFound)
  })

  app.router.use(errorHandler)
  app.wsRouter.use(wsErrorHandler)

  return () => {
    heart.dispose()
    pluginApi?.dispose()
    vscode.dispose()
  }
}
