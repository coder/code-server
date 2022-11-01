import { field, Level, Logger } from "@coder/logger"
import * as express from "express"
import * as fs from "fs"
import * as path from "path"
import * as semver from "semver"
import * as pluginapi from "../../typings/pluginapi"
import { HttpCode, HttpError } from "../common/http"
import { version } from "./constants"
import { authenticated, ensureAuthenticated, replaceTemplates } from "./http"
import { proxy } from "./proxy"
import * as util from "./util"
import { Router as WsRouter, WebsocketRouter, wss } from "./wsRouter"
const fsp = fs.promises

// Represents a required module which could be anything.
type Module = any

/**
 * Inject code-server when `require`d. This is required because the API provides
 * more than just types so these need to be provided at run-time.
 */
const originalLoad = require("module")._load
require("module")._load = function (request: string, parent: object, isMain: boolean): Module {
  return request === "code-server" ? codeServer : originalLoad.apply(this, [request, parent, isMain])
}

/**
 * The module you get when importing "code-server".
 */
export const codeServer = {
  HttpCode,
  HttpError,
  Level,
  authenticated,
  ensureAuthenticated,
  express,
  field,
  proxy,
  replaceTemplates,
  WsRouter,
  wss,
}

interface Plugin extends pluginapi.Plugin {
  /**
   * These fields are populated from the plugin's package.json
   * and now guaranteed to exist.
   */
  name: string
  version: string

  /**
   * path to the node module on the disk.
   */
  modulePath: string
}

interface Application extends pluginapi.Application {
  /*
   * Clone of the above without functions.
   */
  plugin: Omit<Plugin, "init" | "deinit" | "router" | "applications">
}

/**
 * PluginAPI implements the plugin API described in typings/pluginapi.d.ts
 * Please see that file for details.
 */
export class PluginAPI {
  private readonly plugins = new Map<string, Plugin>()
  private readonly logger: Logger

  public constructor(
    logger: Logger,
    /**
     * These correspond to $CS_PLUGIN_PATH and $CS_PLUGIN respectively.
     */
    private readonly csPlugin = "",
    private readonly csPluginPath = `${path.join(util.paths.data, "plugins")}:/usr/share/code-server/plugins`,
    private readonly workingDirectory: string | undefined = undefined,
  ) {
    this.logger = logger.named("pluginapi")
  }

  /**
   * applications grabs the full list of applications from
   * all loaded plugins.
   */
  public async applications(): Promise<Application[]> {
    const apps = new Array<Application>()
    for (const [, p] of this.plugins) {
      if (!p.applications) {
        continue
      }
      const pluginApps = await p.applications()

      // Add plugin key to each app.
      apps.push(
        ...pluginApps.map((app) => {
          app = { ...app, path: path.join(p.routerPath, app.path || "") }
          app = { ...app, iconPath: path.join(app.path || "", app.iconPath) }
          return {
            ...app,
            plugin: {
              name: p.name,
              version: p.version,
              modulePath: p.modulePath,

              displayName: p.displayName,
              description: p.description,
              routerPath: p.routerPath,
              homepageURL: p.homepageURL,
            },
          }
        }),
      )
    }
    return apps
  }

  /**
   * mount mounts all plugin routers onto r and websocket routers onto wr.
   */
  public mount(r: express.Router, wr: express.Router): void {
    for (const [, p] of this.plugins) {
      if (p.router) {
        r.use(`${p.routerPath}`, p.router())
      }
      if (p.wsRouter) {
        wr.use(`${p.routerPath}`, (p.wsRouter() as WebsocketRouter).router)
      }
    }
  }

  /**
   * loadPlugins loads all plugins based on this.csPlugin,
   * this.csPluginPath and the built in plugins.
   */
  public async loadPlugins(loadBuiltin = true): Promise<void> {
    for (const dir of this.csPlugin.split(":")) {
      if (!dir) {
        continue
      }
      await this.loadPlugin(dir)
    }

    for (const dir of this.csPluginPath.split(":")) {
      if (!dir) {
        continue
      }
      await this._loadPlugins(dir)
    }

    if (loadBuiltin) {
      await this._loadPlugins(path.join(__dirname, "../../plugins"))
    }
  }

  /**
   * _loadPlugins is the counterpart to loadPlugins.
   *
   * It differs in that it loads all plugins in a single
   * directory whereas loadPlugins uses all available directories
   * as documented.
   */
  private async _loadPlugins(dir: string): Promise<void> {
    try {
      const entries = await fsp.readdir(dir, { withFileTypes: true })
      for (const ent of entries) {
        if (!ent.isDirectory()) {
          continue
        }
        await this.loadPlugin(path.join(dir, ent.name))
      }
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        this.logger.warn(`failed to load plugins from ${q(dir)}: ${error.message}`)
      }
    }
  }

  private async loadPlugin(dir: string): Promise<void> {
    try {
      const str = await fsp.readFile(path.join(dir, "package.json"), {
        encoding: "utf8",
      })
      const packageJSON: PackageJSON = JSON.parse(str)
      for (const [, p] of this.plugins) {
        if (p.name === packageJSON.name) {
          this.logger.warn(
            `ignoring duplicate plugin ${q(p.name)} at ${q(dir)}, using previously loaded ${q(p.modulePath)}`,
          )
          return
        }
      }
      const p = this._loadPlugin(dir, packageJSON)
      this.plugins.set(p.name, p)
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        this.logger.warn(`failed to load plugin: ${error.stack}`)
      }
    }
  }

  /**
   * _loadPlugin is the counterpart to loadPlugin and actually
   * loads the plugin now that we know there is no duplicate
   * and that the package.json has been read.
   */
  private _loadPlugin(dir: string, packageJSON: PackageJSON): Plugin {
    dir = path.resolve(dir)

    const logger = this.logger.named(packageJSON.name)
    logger.debug("loading plugin", field("plugin_dir", dir), field("package_json", packageJSON))

    if (!packageJSON.name) {
      throw new Error("plugin package.json missing name")
    }
    if (!packageJSON.version) {
      throw new Error("plugin package.json missing version")
    }
    if (!packageJSON.engines || !packageJSON.engines["code-server"]) {
      throw new Error(`plugin package.json missing code-server range like:
  "engines": {
    "code-server": "^3.7.0"
   }
`)
    }
    if (!semver.satisfies(version, packageJSON.engines["code-server"])) {
      this.logger.warn(
        `plugin range ${q(packageJSON.engines["code-server"])} incompatible` + ` with code-server version ${version}`,
      )
    }

    const pluginModule = require(dir)
    if (!pluginModule.plugin) {
      throw new Error("plugin module does not export a plugin")
    }

    const p = {
      name: packageJSON.name,
      version: packageJSON.version,
      modulePath: dir,
      ...pluginModule.plugin,
    } as Plugin

    if (!p.displayName) {
      throw new Error("plugin missing displayName")
    }
    if (!p.description) {
      throw new Error("plugin missing description")
    }
    if (!p.routerPath) {
      throw new Error("plugin missing router path")
    }
    if (!p.routerPath.startsWith("/")) {
      throw new Error(`plugin router path ${q(p.routerPath)}: invalid`)
    }
    if (!p.homepageURL) {
      throw new Error("plugin missing homepage")
    }

    p.init({
      logger: logger,
      workingDirectory: this.workingDirectory,
    })

    logger.debug("loaded")

    return p
  }

  public async dispose(): Promise<void> {
    await Promise.all(
      Array.from(this.plugins.values()).map(async (p) => {
        if (!p.deinit) {
          return
        }
        try {
          await p.deinit()
        } catch (error: any) {
          this.logger.error("plugin failed to deinit", field("name", p.name), field("error", error.message))
        }
      }),
    )
  }
}

interface PackageJSON {
  name: string
  version: string
  engines: {
    "code-server": string
  }
}

function q(s: string | undefined): string {
  if (s === undefined) {
    s = "undefined"
  }
  return JSON.stringify(s)
}
