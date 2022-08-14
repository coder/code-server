/**
 * This file describes the code-server plugin API for adding new applications.
 */
import { field, Level, Logger } from "@coder/logger"
import * as express from "express"
import * as expressCore from "express-serve-static-core"
import ProxyServer from "http-proxy"
import * as stream from "stream"
import Websocket from "ws"

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
 *     "version": "4.0.1",
 *     "iconPath": "/test-plugin/test-app/icon.svg",
 *     "path": "/test-plugin/test-app",
 *     "description": "This app does XYZ.",
 *     "homepageURL": "https://example.com",
 *     "plugin": {
 *       "name": "test-plugin",
 *       "version": "1.0.0",
 *       "modulePath": "/Users/nhooyr/src/coder/code-server/test/test-plugin",
 *       "displayName": "Test Plugin",
 *       "description": "Plugin used in code-server tests.",
 *       "routerPath": "/test-plugin",
 *       "homepageURL": "https://example.com"
 *     }
 *   }
 * ]
 */

export enum HttpCode {
  Ok = 200,
  Redirect = 302,
  NotFound = 404,
  BadRequest = 400,
  Unauthorized = 401,
  LargePayload = 413,
  ServerError = 500,
}

export declare class HttpError extends Error {
  constructor(message: string, status: HttpCode, details?: object)
}

export interface WebsocketRequest extends express.Request {
  ws: stream.Duplex
  head: Buffer
}

export type WebSocketHandler = (
  req: WebsocketRequest,
  res: express.Response,
  next: express.NextFunction,
) => void | Promise<void>

export interface WebsocketRouter {
  readonly router: express.Router
  ws(route: expressCore.PathParams, ...handlers: WebSocketHandler[]): void
}

/**
 * Create a router for websocket routes.
 */
export function WsRouter(): WebsocketRouter

/**
 * The websocket server used by code-server.
 */
export const wss: Websocket.Server

/**
 * The Express import used by code-server.
 *
 * Re-exported so plugins don't have to import duplicate copies of Express and
 * to avoid potential version differences or issues caused by running separate
 * instances.
 */
export { express }
/**
 * Use to add a field to a log.
 *
 * Re-exported so plugins don't have to import duplicate copies of the logger.
 */
export { field, Level, Logger }

/**
 * code-server's proxy server.
 */
export const proxy: ProxyServer

/**
 * Middleware to ensure the user is authenticated. Throws if they are not.
 */
export function ensureAuthenticated(
  req: express.Request,
  res?: express.Response,
  next?: express.NextFunction,
): Promise<void>

/**
 * Returns true if the user is authenticated.
 */
export function authenticated(req: express.Request): Promise<void>

/**
 * Replace variables in HTML: TO, BASE, CS_STATIC_BASE, and OPTIONS.
 */
export function replaceTemplates<T extends object>(
  req: express.Request,
  content: string,
  extraOpts?: Omit<T, "base" | "csStaticBase" | "logLevel">,
): string

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
   * Called when the plugin should dispose/shutdown everything.
   */
  deinit?(): Promise<void>

  /**
   * Returns the plugin's router.
   *
   * Mounted at <code-sever-root>/<plugin-path>
   *
   * If not present, the plugin provides no routes.
   */
  router?(): express.Router

  /**
   * Returns the plugin's websocket router.
   *
   * Mounted at <code-sever-root>/<plugin-path>
   *
   * If not present, the plugin provides no websockets.
   */
  wsRouter?(): WebsocketRouter

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

  /**
   * This can be specified by the user on the command line. Plugins should
   * default to this directory when applicable. For example, the Jupyter plugin
   * uses this to launch in this directory.
   */
  readonly workingDirectory?: string
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
