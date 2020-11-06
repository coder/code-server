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
 * to <code-server-root>/<plugin-path>/<app-path> to access the application.
 */

/**
 * Plugins
 *
 * Plugins are just node modules that contain a top level export "plugin" that implements
 * the Plugin interface.
 *
 * 1. code-server uses $CS_PLUGIN to find plugins.
 *
 * e.g. CS_PLUGIN=/tmp/will:/tmp/teffen will cause code-server to load
 * /tmp/will and /tmp/teffen as plugins.
 *
 * 2. code-server uses $CS_PLUGIN_PATH to find plugins. Each subdirectory in
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
 *
 * 3. Built in plugins are loaded from __dirname/../plugins
 *
 * Plugins are required as soon as they are found and then initialized.
 * See the Plugin interface for details.
 *
 * If two plugins are found with the exact same name, then code-server will
 * use the first one and emit a warning.
 *
 */

/**
 * Programmability
 *
 * There is also a /api/applications endpoint to allow programmatic access to all
 * available applications. It could be used to create a custom application dashboard
 * for example. An important difference with the API is that all application paths
 * will be absolute (i.e have the plugin path prepended) so that they may be used
 * directly.
 *
 * Example output:
 *
 * [
 *   {
 *     "name": "Test App",
 *     "version": "4.0.0",
 *     "iconPath": "/test-plugin/test-app/icon.svg",
 *     "path": "/test-plugin/test-app",
 *     "description": "This app does XYZ.",
 *     "homepageURL": "https://example.com",
 *     "plugin": {
 *       "name": "test-plugin",
 *       "version": "1.0.0",
 *       "modulePath": "/Users/nhooyr/src/cdr/code-server/test/test-plugin",
 *       "displayName": "Test Plugin",
 *       "description": "Plugin used in code-server tests.",
 *       "routerPath": "/test-plugin",
 *       "homepageURL": "https://example.com"
 *     }
 *   }
 * ]
 */

/**
 * Your plugin module must have a top level export "plugin" that implements this interface.
 *
 * The plugin's router will be mounted at <code-sever-root>/<plugin-path>
 */
export interface Plugin {
  /**
   * name is used as the plugin's unique identifier.
   * No two plugins may share the same name.
   *
   * Fetched from package.json.
   */
  readonly name?: string

  /**
   * The version for the plugin in the overlay.
   *
   * Fetched from package.json.
   */
  readonly version?: string

  /**
   * Name used in the overlay.
   */
  readonly displayName: string

  /**
   * Used in overlay.
   * Should be a full sentence describing the plugin.
   */
  readonly description: string

  /**
   * The path at which the plugin router is to be registered.
   */
  readonly routerPath: string

  /**
   * Link to plugin homepage.
   */
  readonly homepageURL: string

  /**
   * init is called so that the plugin may initialize itself with the config.
   */
  init(config: PluginConfig): void

  /**
   * Returns the plugin's router.
   *
   * Mounted at <code-sever-root>/<plugin-path>
   *
   * If not present, the plugin provides no routes.
   */
  router?(): express.Router

  /**
   * code-server uses this to collect the list of applications that
   * the plugin can currently provide.
   * It is called when /api/applications is hit or the overlay needs to
   * refresh the list of applications
   *
   * Ensure this is as fast as possible.
   *
   * If not present, the plugin provides no applications.
   */
  applications?(): Application[] | Promise<Application[]>
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
 */
export interface Application {
  readonly name: string
  readonly version: string

  /**
   * When the user clicks on the icon in the overlay, they will be
   * redirected to <code-server-root>/<plugin-path>/<app-path>
   * where the application should be accessible.
   *
   * If undefined, then <code-server-root>/<plugin-path> is used.
   */
  readonly path?: string

  readonly description?: string

  /**
   * The path at which the icon for this application can be accessed.
   * <code-server-root>/<plugin-path>/<app-path>/<icon-path>
   */
  readonly iconPath: string

  /**
   * Link to application homepage.
   */
  readonly homepageURL: string
}
