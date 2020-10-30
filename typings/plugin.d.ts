/**
 * This file describes the code-server plugin API for adding new applications.
 */
import { Logger } from "@coder/logger"
import * as express from "express"

/**
 * Overlay
 *
 * The homepage of code-server will launch into VS Code. However, there will be an overlay
 * button that when clicked, will show all available applications with their names,
 * icons and provider plugins. When one clicks on an app's icon, they will be directed
 * to <code-server-root>/<plugin-name>/<app-name> to access the application.
 */

/**
 * Plugins
 *
 * Plugins are just node modules.
 *
 * code-server uses $CS_PLUGIN_PATH to find plugins. Each subdirectory in
 * $CS_PLUGIN_PATH with a package.json where the engine is code-server is
 * a valid plugin.
 *
 * e.g. CS_PLUGIN_PATH=/tmp/nhooyr:/tmp/ash will cause code-server to search
 * /tmp/nhooyr and then /tmp/ash for plugins.
 *
 * CS_PLUGIN_PATH defaults to
 * ~/.local/share/code-server/plugins:/usr/share/code-server/plugins
 * if unset.
 *
 * code-server also uses $CS_PLUGIN to find plugins.
 *
 * e.g. CS_PLUGIN=/tmp/will:/tmp/teffen will cause code-server to load
 * /tmp/will and /tmp/teffen as plugins.
 *
 * Built in plugins are also loaded from __dirname/../plugins
 *
 * Priority is $CS_PLUGIN, $CS_PLUGIN_PATH and then the builtin plugins.
 * After the search is complete, plugins will be required in first found order and
 * initialized. See the Plugin interface for details.
 *
 * There is also a /api/applications endpoint to allow programmatic access to all
 * available applications. It could be used to create a custom application dashboard
 * for example.
 */

/**
 * Your plugin module must implement this interface.
 *
 * The plugin's name, description and version are fetched from its module's package.json
 *
 * The plugin's router will be mounted at <code-sever-root>/<plugin-name>
 *
 * If two plugins are found with the exact same name, then code-server will
 * use the last one and emit a warning.
 */
export interface Plugin {
  /**
   * init is called so that the plugin may initialize itself with the config.
   */
  init(config: PluginConfig): void

  /**
   * Returns the plugin's router.
   */
  router(): express.Router

  /**
   * code-server uses this to collect the list of applications that
   * the plugin can currently provide.
   * It is called when /api/applications is hit or the overlay needs to
   * refresh the list of applications
   *
   * Ensure this is as fast as possible.
   */
  applications(): Application[] | Promise<Application[]>
}

/**
 * PluginConfig contains the configuration required for initializing
 * a plugin.
 */
export interface PluginConfig {
  /**
   * All plugin logs should be logged via this logger.
   */
  readonly logger: Logger
}

/**
 * Application represents a user accessible application.
 *
 * When the user clicks on the icon in the overlay, they will be
 * redirected to <code-server-root>/<plugin-name>/<app-name>
 * where the application should be accessible.
 *
 * If the app's name is the same as the plugin's name then
 * <code-server-root>/<plugin-name> will be used instead.
 */
export interface Application {
  readonly name: string
  readonly version: string

  /**
   * The path at which the icon for this application can be accessed.
   * <code-server-root>/<plugin-name>/<app-name>/<icon-path>
   */
  readonly iconPath: string
}
