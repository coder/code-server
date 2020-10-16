import { field, logger } from "@coder/logger"
import { Express } from "express"
import * as fs from "fs"
import * as path from "path"
import * as util from "util"
import { Args } from "./cli"
import { paths } from "./util"

/* eslint-disable @typescript-eslint/no-var-requires */

export type Activate = (app: Express, args: Args) => void

/**
 * Plugins must implement this interface.
 */
export interface Plugin {
  activate: Activate
}

/**
 * Intercept imports so we can inject code-server when the plugin tries to
 * import it.
 */
const originalLoad = require("module")._load
// eslint-disable-next-line @typescript-eslint/no-explicit-any
require("module")._load = function (request: string, parent: object, isMain: boolean): any {
  return originalLoad.apply(this, [request.replace(/^code-server/, path.resolve(__dirname, "../..")), parent, isMain])
}

/**
 * Load a plugin and run its activation function.
 */
const loadPlugin = async (pluginPath: string, app: Express, args: Args): Promise<void> => {
  try {
    const plugin: Plugin = require(pluginPath)
    plugin.activate(app, args)

    const packageJson = require(path.join(pluginPath, "package.json"))
    logger.debug(
      "Loaded plugin",
      field("name", packageJson.name || path.basename(pluginPath)),
      field("path", pluginPath),
      field("version", packageJson.version || "n/a"),
    )
  } catch (error) {
    logger.error(error.message)
  }
}

/**
 * Load all plugins in the specified directory.
 */
const _loadPlugins = async (pluginDir: string, app: Express, args: Args): Promise<void> => {
  try {
    const files = await util.promisify(fs.readdir)(pluginDir, {
      withFileTypes: true,
    })
    await Promise.all(files.map((file) => loadPlugin(path.join(pluginDir, file.name), app, args)))
  } catch (error) {
    if (error.code !== "ENOENT") {
      logger.warn(error.message)
    }
  }
}

/**
 * Load all plugins from the `plugins` directory, directories specified by
 * `CS_PLUGIN_PATH` (colon-separated), and individual plugins specified by
 * `CS_PLUGIN` (also colon-separated).
 */
export const loadPlugins = async (app: Express, args: Args): Promise<void> => {
  const pluginPath = process.env.CS_PLUGIN_PATH || `${path.join(paths.data, "plugins")}:/usr/share/code-server/plugins`
  const plugin = process.env.CS_PLUGIN || ""
  await Promise.all([
    // Built-in plugins.
    _loadPlugins(path.resolve(__dirname, "../../plugins"), app, args),
    // User-added plugins.
    ...pluginPath
      .split(":")
      .filter((p) => !!p)
      .map((dir) => _loadPlugins(path.resolve(dir), app, args)),
    // Individual plugins so you don't have to symlink or move them into a
    // directory specifically for plugins. This lets you load plugins that are
    // on the same level as other directories that are not plugins (if you tried
    // to use CS_PLUGIN_PATH code-server would try to load those other
    // directories as plugins). Intended for development.
    ...plugin
      .split(":")
      .filter((p) => !!p)
      .map((dir) => loadPlugin(path.resolve(dir), app, args)),
  ])
}
