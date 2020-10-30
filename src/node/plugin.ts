import { Logger, field } from "@coder/logger"
import * as express from "express"
import * as fs from "fs"
import * as path from "path"
import * as semver from "semver"
import * as pluginapi from "../../typings/plugin"
import { version } from "./constants"
import * as util from "./util"
const fsp = fs.promises

// These fields are populated from the plugin's package.json.
interface Plugin extends pluginapi.Plugin {
  name: string
  version: string
  description: string
}

interface Application extends pluginapi.Application {
  plugin: Plugin
}

/**
 * PluginAPI implements the plugin API described in typings/plugin.d.ts
 * Please see that file for details.
 */
export class PluginAPI {
  private readonly plugins = new Array<Plugin>()
  private readonly logger: Logger

  public constructor(
    logger: Logger,
    /**
     * These correspond to $CS_PLUGIN_PATH and $CS_PLUGIN respectively.
     */
    private readonly csPlugin = "",
    private readonly csPluginPath = `${path.join(util.paths.data, "plugins")}:/usr/share/code-server/plugins`,
  ) {
    this.logger = logger.named("pluginapi")
  }

  /**
   * applications grabs the full list of applications from
   * all loaded plugins.
   */
  public async applications(): Promise<Application[]> {
    const apps = new Array<Application>()
    for (const p of this.plugins) {
      const pluginApps = await p.applications()

      // TODO prevent duplicates
      // Add plugin key to each app.
      apps.push(
        ...pluginApps.map((app) => {
          return { ...app, plugin: p }
        }),
      )
    }
    return apps
  }

  /**
   * mount mounts all plugin routers onto r.
   */
  public mount(r: express.Router): void {
    for (const p of this.plugins) {
      r.use(`/${p.name}`, p.router())
    }
  }

  /**
   * loadPlugins loads all plugins based on this.csPluginPath
   * and this.csPlugin.
   */
  public async loadPlugins(): Promise<void> {
    // Built-in plugins.
    await this._loadPlugins(path.join(__dirname, "../../plugins"))

    for (const dir of this.csPluginPath.split(":")) {
      if (!dir) {
        continue
      }
      await this._loadPlugins(dir)
    }

    for (const dir of this.csPlugin.split(":")) {
      if (!dir) {
        continue
      }
      await this.loadPlugin(dir)
    }
  }

  private async _loadPlugins(dir: string): Promise<void> {
    try {
      const entries = await fsp.readdir(dir, { withFileTypes: true })
      for (const ent of entries) {
        if (!ent.isDirectory()) {
          continue
        }
        await this.loadPlugin(path.join(dir, ent.name))
      }
    } catch (err) {
      if (err.code !== "ENOENT") {
        this.logger.warn(`failed to load plugins from ${q(dir)}: ${err.message}`)
      }
    }
  }

  private async loadPlugin(dir: string): Promise<void> {
    try {
      const str = await fsp.readFile(path.join(dir, "package.json"), {
        encoding: "utf8",
      })
      const packageJSON: PackageJSON = JSON.parse(str)
      const p = this._loadPlugin(dir, packageJSON)
      // TODO prevent duplicates
      this.plugins.push(p)
    } catch (err) {
      if (err.code !== "ENOENT") {
        this.logger.warn(`failed to load plugin: ${err.message}`)
      }
    }
  }

  private _loadPlugin(dir: string, packageJSON: PackageJSON): Plugin {
    const logger = this.logger.named(packageJSON.name)
    logger.debug("loading plugin", field("plugin_dir", dir), field("package_json", packageJSON))

    if (!semver.satisfies(version, packageJSON.engines["code-server"])) {
      throw new Error(
        `plugin range ${q(packageJSON.engines["code-server"])} incompatible` + ` with code-server version ${version}`,
      )
    }
    if (!packageJSON.name) {
      throw new Error("plugin missing name")
    }
    if (!packageJSON.version) {
      throw new Error("plugin missing version")
    }
    if (!packageJSON.description) {
      throw new Error("plugin missing description")
    }

    const p = {
      name: packageJSON.name,
      version: packageJSON.version,
      description: packageJSON.description,
      ...require(dir),
    } as Plugin

    p.init({
      logger: logger,
    })

    logger.debug("loaded")

    return p
  }
}

interface PackageJSON {
  name: string
  version: string
  description: string
  engines: {
    "code-server": string
  }
}

function q(s: string): string {
  if (s === undefined) {
    s = "undefined"
  }
  return JSON.stringify(s)
}
