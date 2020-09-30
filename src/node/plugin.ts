import { field, logger } from "@coder/logger"
import * as fs from "fs"
import * as path from "path"
import * as util from "util"
import { Args } from "./cli"
import { HttpServer } from "./http"
import { paths } from "./util"

/* eslint-disable @typescript-eslint/no-var-requires */

export type Activate = (httpServer: HttpServer, args: Args) => void

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
const loadPlugin = async (pluginPath: string, httpServer: HttpServer, args: Args): Promise<void> => {
  try {
    const plugin: Plugin = require(pluginPath)
    plugin.activate(httpServer, args)

    logger.debug(
      "Loaded plugin",
      field("name", path.basename(pluginPath)),
      field("version", require(path.join(pluginPath, "package.json")).version || "n/a"),
    )
  } catch (error) {
    if (error.code !== "MODULE_NOT_FOUND") {
      logger.warn(error.message)
    } else {
      logger.error(error.message)
    }
  }
}

/**
 * Load all plugins in the specified directory.
 */
const _loadPlugins = async (pluginDir: string, httpServer: HttpServer, args: Args): Promise<void> => {
  try {
    const files = await util.promisify(fs.readdir)(pluginDir, {
      withFileTypes: true,
    })
    await Promise.all(files.map((file) => loadPlugin(path.join(pluginDir, file.name), httpServer, args)))
  } catch (error) {
    if (error.code !== "ENOENT") {
      logger.warn(error.message)
    }
  }
}

/**
 * Load all plugins from the `plugins` directory and the directory specified by
 * `PLUGIN_DIR`.

 * Also load any individual plugins found in `PLUGIN_DIRS` (colon-separated).
 * This allows you to test and develop plugins without having to move or symlink
 * them into one directory.
 */
export const loadPlugins = async (httpServer: HttpServer, args: Args): Promise<void> => {
  await Promise.all([
    // Built-in plugins.
    _loadPlugins(path.resolve(__dirname, "../../plugins"), httpServer, args),
    // User-added plugins.
    _loadPlugins(
      path.resolve(process.env.PLUGIN_DIR || path.join(paths.data, "code-server-extensions")),
      httpServer,
      args,
    ),
    // For development so you don't have to use symlinks.
    process.env.PLUGIN_DIRS &&
      (await Promise.all(process.env.PLUGIN_DIRS.split(":").map((dir) => loadPlugin(dir, httpServer, args)))),
  ])
}
