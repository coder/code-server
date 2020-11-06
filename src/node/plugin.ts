import { Logger, field } from "@coder/logger"
import * as express from "express"
import * as fs from "fs"
import * as hijackresponse from "hijackresponse"
import * as path from "path"
import * as semver from "semver"
import * as pluginapi from "../../typings/pluginapi"
import { version } from "./constants"
import * as util from "./util"
const fsp = fs.promises

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
  plugin: Omit<Plugin, "init" | "router" | "applications">
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
   * mount mounts all plugin routers onto r.
   */
  public mount(r: express.Router): void {
    for (const [, p] of this.plugins) {
      if (!p.router) {
        continue
      }
      const pr = p.router()
      r.use(`${p.routerPath}`, (req, res, next) => {
        // All HTML responses need the overlay javascript injected.
        tryInjectOverlay(res)
        pr(req, res, next)
      })
    }
  }

  /**
   * loadPlugins loads all plugins based on this.csPlugin,
   * this.csPluginPath and the built in plugins.
   */
  public async loadPlugins(): Promise<void> {
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

    // Built-in plugins.
    await this._loadPlugins(path.join(__dirname, "../../plugins"))
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
    } catch (err) {
      if (err.code !== "ENOENT") {
        this.logger.warn(`failed to load plugin: ${err.stack}`)
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
    "code-server": "^3.6.0"
   }
`)
    }
    if (!semver.satisfies(version, packageJSON.engines["code-server"])) {
      throw new Error(
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
    if (!p.routerPath.startsWith("/") || p.routerPath.length < 2) {
      throw new Error(`plugin router path ${q(p.routerPath)}: invalid`)
    }
    if (!p.homepageURL) {
      throw new Error("plugin missing homepage")
    }

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

function tryInjectOverlay(res: express.Response) {
  hijackresponse.default(res).then((hj) => {
    if (!res.get("Content-Type").includes("text/html")) {
      hj.readable.pipe(hj.writable)
      return
    }
    injectOverlay(res, hj)
  })
}

// injectOverlay injects the script tag for the overlay into the HTML response
// in res.
// A point of improvement is to make it stream instead of buffer the entire response.
// See for example https://www.npmjs.com/package/stream-buffer-replace
async function injectOverlay(res: express.Response, hj: hijackresponse.HJ): Promise<void> {
  res.removeHeader("Content-Length")

  try {
    const bodyPromise = new Promise<string>((res, rej) => {
      hj.readable.on("close", rej)
      hj.writable.on("close", rej)
      hj.readable.on("error", rej)
      hj.writable.on("error", rej)

      const chunks: Buffer[] = []
      hj.readable.on("data", (chunk: Buffer) => {
        chunks.push(chunk)
      })
      hj.readable.on("end", () => {
        res(String(Buffer.concat(chunks)))
      })
    })
    let body = await bodyPromise
    body = injectOverlayHTML(body)
    hj.writable.write(body)
    hj.writable.end()
  } catch (err) {
    hj.destroyAndRestore()
    res.status(500)
    res.json({ error: "overlay script injection failed" })
  }
}

/**
 * injectOverlayString injects the app-overlay.js script tag
 * into the html.
 */
export function injectOverlayHTML(html: string): string {
  return html.replace(
    "</head>",
    `  <script defer data-cfasync="false" src="./dist/app-overlay.js"></script>
  </head>`,
  )
}
