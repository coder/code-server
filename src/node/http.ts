import { logger } from "@coder/logger"
import * as fs from "fs-extra"
import * as http from "http"
import * as httpolyglot from "httpolyglot"
import * as https from "https"
import * as net from "net"
import * as path from "path"
import * as querystring from "querystring"
import safeCompare from "safe-compare"
import { Readable } from "stream"
import * as tarFs from "tar-fs"
import * as tls from "tls"
import * as url from "url"
import { HttpCode, HttpError } from "../common/http"
import { normalize, plural, split } from "../common/util"
import { getMediaMime, xdgLocalDir } from "./util"

export type Cookies = { [key: string]: string[] | undefined }
export type PostData = { [key: string]: string | string[] | undefined }

interface AuthPayload extends Cookies {
  key?: string[]
}

export enum AuthType {
  Password = "password",
  None = "none",
}

export type Query = { [key: string]: string | string[] | undefined }

export interface HttpResponse<T = string | Buffer | object> {
  /*
   * Whether to set cache-control headers for this response.
   */
  cache?: boolean
  /**
   * If the code cannot be determined automatically set it here. The
   * defaults are 302 for redirects and 200 for successful requests. For errors
   * you should throw an HttpError and include the code there. If you
   * use Error it will default to 404 for ENOENT and EISDIR and 500 otherwise.
   */
  code?: number
  /**
   * Content to write in the response. Mutually exclusive with stream.
   */
  content?: T
  /**
   * Cookie to write with the response.
   */
  cookie?: { key: string; value: string }
  /**
   * Used to automatically determine the appropriate mime type.
   */
  filePath?: string
  /**
   * Additional headers to include.
   */
  headers?: http.OutgoingHttpHeaders
  /**
   * If the mime type cannot be determined automatically set it here.
   */
  mime?: string
  /**
   * Redirect to this path. Will rewrite against the base path but NOT the
   * provider endpoint so you must include it. This allows redirecting outside
   * of your endpoint. Use `withBase()` to redirect within your endpoint.
   */
  redirect?: string
  /**
   * Stream this to the response. Mutually exclusive with content.
   */
  stream?: Readable
  /**
   * Query variables to add in addition to current ones when redirecting. Use
   * `undefined` to remove a query variable.
   */
  query?: Query
}

/**
 * Use when you need to run search and replace on a file's content before
 * sending it.
 */
export interface HttpStringFileResponse extends HttpResponse {
  content: string
  filePath: string
}

export interface HttpServerOptions {
  readonly auth?: AuthType
  readonly basePath?: string
  readonly cert?: string
  readonly certKey?: string
  readonly commit?: string
  readonly host?: string
  readonly password?: string
  readonly port?: number
  readonly socket?: string
}

interface ProviderRoute {
  base: string
  requestPath: string
  query: querystring.ParsedUrlQuery
  provider: HttpProvider
  fullPath: string
  originalPath: string
}

export interface HttpProviderOptions {
  readonly base: string
  readonly auth: AuthType
  readonly password?: string
  readonly commit?: string
}

/**
 * Provides HTTP responses. This abstract class provides some helpers for
 * interpreting, creating, and authenticating responses.
 */
export abstract class HttpProvider {
  protected readonly rootPath = path.resolve(__dirname, "../..")

  public constructor(protected readonly options: HttpProviderOptions) {}

  public dispose(): void {
    // No default behavior.
  }

  /**
   * Handle web sockets on the registered endpoint.
   */
  public abstract handleWebSocket(
    base: string,
    requestPath: string,
    query: querystring.ParsedUrlQuery,
    request: http.IncomingMessage,
    socket: net.Socket,
    head: Buffer
  ): Promise<true | undefined>

  /**
   * Handle requests to the registered endpoint.
   */
  public abstract handleRequest(
    base: string,
    requestPath: string,
    query: querystring.ParsedUrlQuery,
    request: http.IncomingMessage
  ): Promise<HttpResponse | undefined>

  /**
   * Return the specified path with the base path prepended.
   */
  protected withBase(path: string): string {
    return normalize(`${this.options.base}/${path}`)
  }

  /**
   * Get a file resource.
   * TODO: Would a stream be faster, at least for large files?
   */
  protected async getResource(...parts: string[]): Promise<HttpResponse> {
    const filePath = path.join(...parts)
    return { content: await fs.readFile(filePath), filePath }
  }

  /**
   * Get a file resource as a string.
   */
  protected async getUtf8Resource(...parts: string[]): Promise<HttpStringFileResponse> {
    const filePath = path.join(...parts)
    return { content: await fs.readFile(filePath, "utf8"), filePath }
  }

  /**
   * Tar up and stream a directory.
   */
  protected async getTarredResource(...parts: string[]): Promise<HttpResponse> {
    const filePath = path.join(...parts)
    return { stream: tarFs.pack(filePath), filePath, mime: "application/tar", cache: true }
  }

  /**
   * Helper to error on anything that's not a GET.
   */
  protected ensureGet(request: http.IncomingMessage): void {
    if (request.method !== "GET") {
      throw new HttpError(`Unsupported method ${request.method}`, HttpCode.BadRequest)
    }
  }

  /**
   * Helper to error if not authorized.
   */
  protected ensureAuthenticated(request: http.IncomingMessage): void {
    if (!this.authenticated(request)) {
      throw new HttpError("Unauthorized", HttpCode.Unauthorized)
    }
  }

  /**
   * Use the first query value or the default if there isn't one.
   */
  protected queryOrDefault(value: string | string[] | undefined, def: string): string {
    if (Array.isArray(value)) {
      value = value[0]
    }
    return typeof value !== "undefined" ? value : def
  }

  /**
   * Return the provided password value if the payload contains the right
   * password otherwise return false. If no payload is specified use cookies.
   */
  protected authenticated(request: http.IncomingMessage, payload?: AuthPayload): string | boolean {
    switch (this.options.auth) {
      case AuthType.None:
        return true
      case AuthType.Password:
        if (typeof payload === "undefined") {
          payload = this.parseCookies<AuthPayload>(request)
        }
        if (this.options.password && payload.key) {
          for (let i = 0; i < payload.key.length; ++i) {
            if (safeCompare(payload.key[i], this.options.password)) {
              return payload.key[i]
            }
          }
        }
        return false
      default:
        throw new Error(`Unsupported auth type ${this.options.auth}`)
    }
  }

  /**
   * Parse POST data.
   */
  protected getData(request: http.IncomingMessage): Promise<string | undefined> {
    return request.method === "POST" || request.method === "DELETE"
      ? new Promise<string>((resolve, reject) => {
          let body = ""
          const onEnd = (): void => {
            off() // eslint-disable-line @typescript-eslint/no-use-before-define
            resolve(body || undefined)
          }
          const onError = (error: Error): void => {
            off() // eslint-disable-line @typescript-eslint/no-use-before-define
            reject(error)
          }
          const onData = (d: Buffer): void => {
            body += d
            if (body.length > 1e6) {
              onError(new HttpError("Payload is too large", HttpCode.LargePayload))
              request.connection.destroy()
            }
          }
          const off = (): void => {
            request.off("error", onError)
            request.off("data", onError)
            request.off("end", onEnd)
          }
          request.on("error", onError)
          request.on("data", onData)
          request.on("end", onEnd)
        })
      : Promise.resolve(undefined)
  }

  /**
   * Parse cookies.
   */
  protected parseCookies<T extends Cookies>(request: http.IncomingMessage): T {
    const cookies: { [key: string]: string[] } = {}
    if (request.headers.cookie) {
      request.headers.cookie.split(";").forEach((keyValue) => {
        const [key, value] = split(keyValue, "=")
        if (!cookies[key]) {
          cookies[key] = []
        }
        cookies[key].push(decodeURI(value))
      })
    }
    return cookies as T
  }
}

/**
 * Provides a heartbeat using a local file to indicate activity.
 */
export class Heart {
  private heartbeatTimer?: NodeJS.Timeout
  private heartbeatInterval = 60000
  private lastHeartbeat = 0

  public constructor(private readonly heartbeatPath: string, private readonly isActive: () => Promise<boolean>) {}

  /**
   * Write to the heartbeat file if we haven't already done so within the
   * timeout and start or reset a timer that keeps running as long as there is
   * activity. Failures are logged as warnings.
   */
  public beat(): void {
    const now = Date.now()
    if (now - this.lastHeartbeat >= this.heartbeatInterval) {
      logger.trace("heartbeat")
      fs.outputFile(this.heartbeatPath, "").catch((error) => {
        logger.warn(error.message)
      })
      this.lastHeartbeat = now
      if (typeof this.heartbeatTimer !== "undefined") {
        clearTimeout(this.heartbeatTimer)
      }
      this.heartbeatTimer = setTimeout(() => {
        this.isActive().then((active) => {
          if (active) {
            this.beat()
          }
        })
      }, this.heartbeatInterval)
    }
  }
}

export interface HttpProvider0<T> {
  new (options: HttpProviderOptions): T
}

export interface HttpProvider1<A1, T> {
  new (options: HttpProviderOptions, a1: A1): T
}

/**
 * An HTTP server. Its main role is to route incoming HTTP requests to the
 * appropriate provider for that endpoint then write out the response. It also
 * covers some common use cases like redirects and caching.
 */
export class HttpServer {
  protected readonly server: http.Server | https.Server
  private listenPromise: Promise<string | null> | undefined
  public readonly protocol: "http" | "https"
  private readonly providers = new Map<string, HttpProvider>()
  private readonly options: HttpServerOptions
  private readonly heart: Heart

  public constructor(options: HttpServerOptions) {
    this.heart = new Heart(path.join(xdgLocalDir, "heartbeat"), async () => {
      const connections = await this.getConnections()
      logger.trace(`${connections} active connection${plural(connections)}`)
      return connections !== 0
    })
    this.options = {
      ...options,
      basePath: options.basePath ? options.basePath.replace(/\/+$/, "") : "",
    }
    this.protocol = this.options.cert ? "https" : "http"
    if (this.protocol === "https") {
      this.server = httpolyglot.createServer(
        {
          cert: this.options.cert && fs.readFileSync(this.options.cert),
          key: this.options.certKey && fs.readFileSync(this.options.certKey),
        },
        this.onRequest
      )
    } else {
      this.server = http.createServer(this.onRequest)
    }
  }

  public dispose(): void {
    this.providers.forEach((p) => p.dispose())
  }

  public async getConnections(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.server.getConnections((error, count) => {
        return error ? reject(error) : resolve(count)
      })
    })
  }

  /**
   * Register a provider for a top-level endpoint.
   */
  public registerHttpProvider<T extends HttpProvider>(endpoint: string, provider: HttpProvider0<T>): void
  public registerHttpProvider<A1, T extends HttpProvider>(
    endpoint: string,
    provider: HttpProvider1<A1, T>,
    a1: A1
  ): void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public registerHttpProvider(endpoint: string, provider: any, a1?: any): void {
    endpoint = endpoint.replace(/^\/+|\/+$/g, "")
    if (this.providers.has(`/${endpoint}`)) {
      throw new Error(`${endpoint} is already registered`)
    }
    if (/\//.test(endpoint)) {
      throw new Error(`Only top-level endpoints are supported (got ${endpoint})`)
    }
    this.providers.set(
      `/${endpoint}`,
      new provider(
        {
          auth: this.options.auth || AuthType.None,
          base: endpoint,
          commit: this.options.commit,
          password: this.options.password,
        },
        a1
      )
    )
  }

  /**
   * Start listening on the specified port.
   */
  public listen(): Promise<string | null> {
    if (!this.listenPromise) {
      this.listenPromise = new Promise((resolve, reject) => {
        this.server.on("error", reject)
        this.server.on("upgrade", this.onUpgrade)
        const onListen = (): void => resolve(this.address())
        if (this.options.socket) {
          this.server.listen(this.options.socket, onListen)
        } else {
          this.server.listen(this.options.port, this.options.host, onListen)
        }
      })
    }
    return this.listenPromise
  }

  /**
   * The *local* address of the server.
   */
  public address(): string | null {
    const address = this.server.address()
    const endpoint =
      typeof address !== "string" && address !== null
        ? (address.address === "::" ? "localhost" : address.address) + ":" + address.port
        : address
    return endpoint && `${this.protocol}://${endpoint}`
  }

  private onRequest = async (request: http.IncomingMessage, response: http.ServerResponse): Promise<void> => {
    try {
      this.heart.beat()
      const route = this.parseUrl(request)
      const payload =
        this.maybeRedirect(request, route) ||
        (await route.provider.handleRequest(route.base, route.requestPath, route.query, request))
      if (!payload) {
        throw new HttpError("Not found", HttpCode.NotFound)
      }
      const basePath = this.options.basePath || "/"
      response.writeHead(payload.redirect ? HttpCode.Redirect : payload.code || HttpCode.Ok, {
        "Content-Type": payload.mime || getMediaMime(payload.filePath),
        ...(payload.redirect
          ? {
              Location: this.constructRedirect(
                request.headers.host as string,
                route.fullPath,
                normalize(`${basePath}/${payload.redirect}`) + "/",
                { ...route.query, ...(payload.query || {}) }
              ),
            }
          : {}),
        ...(request.headers["service-worker"] ? { "Service-Worker-Allowed": basePath } : {}),
        ...(payload.cache ? { "Cache-Control": "public, max-age=31536000" } : {}),
        ...(payload.cookie
          ? {
              "Set-Cookie": `${payload.cookie.key}=${payload.cookie.value}; Path=${basePath}; HttpOnly; SameSite=strict`,
            }
          : {}),
        ...payload.headers,
      })
      if (payload.stream) {
        payload.stream.on("error", (error: NodeJS.ErrnoException) => {
          response.writeHead(error.code === "ENOENT" ? HttpCode.NotFound : HttpCode.ServerError)
          response.end(error.message)
        })
        payload.stream.pipe(response)
      } else if (typeof payload.content === "string" || payload.content instanceof Buffer) {
        response.end(payload.content)
      } else if (payload.content && typeof payload.content === "object") {
        response.end(JSON.stringify(payload.content))
      } else {
        response.end()
      }
    } catch (error) {
      let e = error
      if (error.code === "ENOENT" || error.code === "EISDIR") {
        e = new HttpError("Not found", HttpCode.NotFound)
      } else {
        logger.error(error.stack)
      }
      response.writeHead(typeof e.code === "number" ? e.code : HttpCode.ServerError)
      response.end(error.message)
    }
  }

  /**
   * Return any necessary redirection before delegating to a provider.
   */
  private maybeRedirect(request: http.IncomingMessage, route: ProviderRoute): HttpResponse | undefined {
    // Redirect to HTTPS.
    if (this.options.cert && !(request.connection as tls.TLSSocket).encrypted) {
      return { redirect: route.fullPath }
    }
    // Redirect indexes to a trailing slash so relative paths will operate
    // against the provider.
    if (route.requestPath === "/index.html" && !route.originalPath.endsWith("/")) {
      return { redirect: route.fullPath } // Redirect always includes a trailing slash.
    }
    return undefined
  }

  private onUpgrade = async (request: http.IncomingMessage, socket: net.Socket, head: Buffer): Promise<void> => {
    try {
      this.heart.beat()
      socket.on("error", () => socket.destroy())

      if (this.options.cert && !(socket as tls.TLSSocket).encrypted) {
        throw new HttpError("HTTP websocket", HttpCode.BadRequest)
      }

      if (!request.headers.upgrade || request.headers.upgrade.toLowerCase() !== "websocket") {
        throw new HttpError("HTTP/1.1 400 Bad Request", HttpCode.BadRequest)
      }

      const { base, requestPath, query, provider } = this.parseUrl(request)
      if (!provider) {
        throw new HttpError("Not found", HttpCode.NotFound)
      }

      if (!(await provider.handleWebSocket(base, requestPath, query, request, socket, head))) {
        throw new HttpError("Not found", HttpCode.NotFound)
      }
    } catch (error) {
      socket.destroy(error)
      logger.warn(`discarding socket connection: ${error.message}`)
    }
  }

  /**
   * Parse a request URL so we can route it.
   */
  private parseUrl(request: http.IncomingMessage): ProviderRoute {
    const parse = (fullPath: string): { base: string; requestPath: string } => {
      const match = fullPath.match(/^(\/?[^/]*)(.*)$/)
      let [, /* ignore */ base, requestPath] = match ? match.map((p) => p.replace(/\/+$/, "")) : ["", "", ""]
      if (base.indexOf(".") !== -1) {
        // Assume it's a file at the root.
        requestPath = base
        base = "/"
      } else if (base === "") {
        // Happens if it's a plain `domain.com`.
        base = "/"
      }
      requestPath = requestPath || "/index.html"
      // Allow for a versioned static endpoint. This lets us cache every static
      // resource underneath the path based on the version without any work and
      // without adding query parameters which have their own issues.
      if (/^\/static-/.test(base)) {
        base = "/static"
      }

      return { base, requestPath }
    }

    const parsedUrl = request.url ? url.parse(request.url, true) : { query: {}, pathname: "" }
    const originalPath = parsedUrl.pathname || ""
    const fullPath = normalize(originalPath)
    const { base, requestPath } = parse(fullPath)

    // Providers match on the path after their base so we need to account for
    // that by shifting the next base out of the request path.
    let provider = this.providers.get(base)
    if (base !== "/" && provider) {
      return { ...parse(requestPath), fullPath, query: parsedUrl.query, provider, originalPath }
    }

    // Fall back to the top-level provider.
    provider = this.providers.get("/")
    if (!provider) {
      throw new Error(`No provider for ${base}`)
    }
    return { base, fullPath, requestPath, query: parsedUrl.query, provider, originalPath }
  }

  /**
   * Return the request URL with the specified base and new path.
   */
  private constructRedirect(host: string, oldPath: string, newPath: string, query: Query): string {
    if (oldPath && oldPath !== "/" && !query.to && /\/login(\/|$)/.test(newPath) && !/\/login(\/|$)/.test(oldPath)) {
      query.to = oldPath
    }
    Object.keys(query).forEach((key) => {
      if (typeof query[key] === "undefined") {
        delete query[key]
      }
    })
    return (
      `${this.protocol}://${host}${newPath}` + (Object.keys(query).length > 0 ? `?${querystring.stringify(query)}` : "")
    )
  }
}
