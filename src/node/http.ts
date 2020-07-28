import { field, logger } from "@coder/logger"
import * as fs from "fs-extra"
import * as http from "http"
import proxy from "http-proxy"
import * as httpolyglot from "httpolyglot"
import * as https from "https"
import * as net from "net"
import * as path from "path"
import * as querystring from "querystring"
import safeCompare from "safe-compare"
import { Readable } from "stream"
import * as tls from "tls"
import * as url from "url"
import { HttpCode, HttpError } from "../common/http"
import { arrayify, normalize, Options, plural, split, trimSlashes } from "../common/util"
import { SocketProxyProvider } from "./socket"
import { getMediaMime, paths } from "./util"

export type Cookies = { [key: string]: string[] | undefined }
export type PostData = { [key: string]: string | string[] | undefined }

interface ProxyRequest extends http.IncomingMessage {
  base?: string
}

interface AuthPayload extends Cookies {
  key?: string[]
}

export enum AuthType {
  Password = "password",
  None = "none",
}

export type Query = { [key: string]: string | string[] | undefined }

export interface ProxyOptions {
  /**
   * A path to strip from from the beginning of the request before proxying
   */
  strip?: string
  /**
   * A path to add to the beginning of the request before proxying.
   */
  prepend?: string
  /**
   * The port to proxy.
   */
  port: string
}

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
   * NOTE: Cookie paths must be absolute. The default is /.
   */
  cookie?: { key: string; value: string; path?: string }
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
   * Redirect to this path. This is constructed against the site base (not the
   * provider's base).
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
  /**
   * Indicates the request should be proxied.
   */
  proxy?: ProxyOptions
}

export interface WsResponse {
  /**
   * Indicates the web socket should be proxied.
   */
  proxy?: ProxyOptions
}

/**
 * Use when you need to run search and replace on a file's content before
 * sending it.
 */
export interface HttpStringFileResponse extends HttpResponse {
  content: string
  filePath: string
}

export interface RedirectResponse extends HttpResponse {
  redirect: string
}

export interface HttpServerOptions {
  readonly auth?: AuthType
  readonly cert?: string
  readonly certKey?: string
  readonly commit?: string
  readonly host?: string
  readonly password?: string
  readonly port?: number
  readonly proxyDomains?: string[]
  readonly socket?: string
}

export interface Route {
  /**
   * Provider base path part (for /provider/base/path it would be /provider).
   */
  providerBase: string
  /**
   * Base path part (for /provider/base/path it would be /base).
   */
  base: string
  /**
   * Remaining part of the route after factoring out the base and provider base
   * (for /provider/base/path it would be /path). It can be blank.
   */
  requestPath: string
  /**
   * Query variables included in the request.
   */
  query: querystring.ParsedUrlQuery
  /**
   * Normalized version of `originalPath`.
   */
  fullPath: string
  /**
   * Original path of the request without any modifications.
   */
  originalPath: string
}

interface ProviderRoute extends Route {
  provider: HttpProvider
}

export interface HttpProviderOptions {
  readonly auth: AuthType
  readonly commit: string
  readonly password?: string
}

/**
 * Provides HTTP responses. This abstract class provides some helpers for
 * interpreting, creating, and authenticating responses.
 */
export abstract class HttpProvider {
  protected readonly rootPath = path.resolve(__dirname, "../..")

  public constructor(protected readonly options: HttpProviderOptions) {}

  public async dispose(): Promise<void> {
    // No default behavior.
  }

  /**
   * Handle web sockets on the registered endpoint. Normally the provider
   * handles the request itself but it can return a response when necessary. The
   * default is to throw a 404.
   */
  public handleWebSocket(
    /* eslint-disable @typescript-eslint/no-unused-vars */
    _route: Route,
    _request: http.IncomingMessage,
    _socket: net.Socket,
    _head: Buffer,
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ): Promise<WsResponse | void> {
    throw new HttpError("Not found", HttpCode.NotFound)
  }

  /**
   * Handle requests to the registered endpoint.
   */
  public abstract handleRequest(route: Route, request: http.IncomingMessage): Promise<HttpResponse>

  /**
   * Get the base relative to the provided route. For each slash we need to go
   * up a directory. For example:
   * / => ./
   * /foo => ./
   * /foo/ => ./../
   * /foo/bar => ./../
   * /foo/bar/ => ./../../
   */
  public base(route: Route): string {
    const depth = (route.originalPath.match(/\//g) || []).length
    return normalize("./" + (depth > 1 ? "../".repeat(depth - 1) : ""))
  }

  /**
   * Get error response.
   */
  public async getErrorRoot(route: Route, title: string, header: string, body: string): Promise<HttpResponse> {
    const response = await this.getUtf8Resource(this.rootPath, "src/browser/pages/error.html")
    response.content = response.content
      .replace(/{{ERROR_TITLE}}/g, title)
      .replace(/{{ERROR_HEADER}}/g, header)
      .replace(/{{ERROR_BODY}}/g, body)
    return this.replaceTemplates(route, response)
  }

  /**
   * Replace common templates strings.
   */
  protected replaceTemplates<T extends object>(
    route: Route,
    response: HttpStringFileResponse,
    extraOptions?: Omit<T, "base" | "csStaticBase" | "logLevel">,
  ): HttpStringFileResponse {
    const options: Options = {
      base: this.base(route),
      commit: this.options.commit,
      logLevel: logger.level,
      ...extraOptions,
    }
    response.content = response.content
      .replace(/{{COMMIT}}/g, this.options.commit)
      .replace(/{{TO}}/g, Array.isArray(route.query.to) ? route.query.to[0] : route.query.to || "/dashboard")
      .replace(/{{BASE}}/g, this.base(route))
      .replace(/"{{OPTIONS}}"/, `'${JSON.stringify(options)}'`)
    return response
  }

  protected get isDev(): boolean {
    return this.options.commit === "development"
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
   * Helper to error on invalid methods (default GET).
   */
  protected ensureMethod(request: http.IncomingMessage, method?: string | string[]): void {
    const check = arrayify(method || "GET")
    if (!request.method || !check.includes(request.method)) {
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
  public authenticated(request: http.IncomingMessage, payload?: AuthPayload): string | boolean {
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

  /**
   * Return true if the route is for the root page. For example /base, /base/,
   * or /base/index.html but not /base/path or /base/file.js.
   */
  protected isRoot(route: Route): boolean {
    return !route.requestPath || route.requestPath === "/index.html"
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
        this.isActive()
          .then((active) => {
            if (active) {
              this.beat()
            }
          })
          .catch((error) => {
            logger.warn(error.message)
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

export interface HttpProvider2<A1, A2, T> {
  new (options: HttpProviderOptions, a1: A1, a2: A2): T
}

export interface HttpProvider3<A1, A2, A3, T> {
  new (options: HttpProviderOptions, a1: A1, a2: A2, a3: A3): T
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
  private readonly heart: Heart
  private readonly socketProvider = new SocketProxyProvider()

  /**
   * Proxy domains are stored here without the leading `*.`
   */
  public readonly proxyDomains: Set<string>

  /**
   * Provides the actual proxying functionality.
   */
  private readonly proxy = proxy.createProxyServer({})

  public constructor(private readonly options: HttpServerOptions) {
    this.proxyDomains = new Set((options.proxyDomains || []).map((d) => d.replace(/^\*\./, "")))
    this.heart = new Heart(path.join(paths.data, "heartbeat"), async () => {
      const connections = await this.getConnections()
      logger.trace(`${connections} active connection${plural(connections)}`)
      return connections !== 0
    })
    this.protocol = this.options.cert ? "https" : "http"
    if (this.protocol === "https") {
      this.server = httpolyglot.createServer(
        {
          cert: this.options.cert && fs.readFileSync(this.options.cert),
          key: this.options.certKey && fs.readFileSync(this.options.certKey),
        },
        this.onRequest,
      )
    } else {
      this.server = http.createServer(this.onRequest)
    }
    this.proxy.on("error", (error, _request, response) => {
      response.writeHead(HttpCode.ServerError)
      response.end(error.message)
    })
    // Intercept the response to rewrite absolute redirects against the base path.
    this.proxy.on("proxyRes", (response, request: ProxyRequest) => {
      if (response.headers.location && response.headers.location.startsWith("/") && request.base) {
        response.headers.location = request.base + response.headers.location
      }
    })
  }

  /**
   * Stop and dispose everything. Return an array of disposal errors.
   */
  public async dispose(): Promise<Error[]> {
    this.socketProvider.stop()
    const providers = Array.from(this.providers.values())
    // Catch so all the errors can be seen rather than just the first one.
    const responses = await Promise.all<Error | undefined>(providers.map((p) => p.dispose().catch((e) => e)))
    return responses.filter<Error>((r): r is Error => typeof r !== "undefined")
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
  public registerHttpProvider<T extends HttpProvider>(endpoint: string | string[], provider: HttpProvider0<T>): T
  public registerHttpProvider<A1, T extends HttpProvider>(
    endpoint: string | string[],
    provider: HttpProvider1<A1, T>,
    a1: A1,
  ): T
  public registerHttpProvider<A1, A2, T extends HttpProvider>(
    endpoint: string | string[],
    provider: HttpProvider2<A1, A2, T>,
    a1: A1,
    a2: A2,
  ): T
  public registerHttpProvider<A1, A2, A3, T extends HttpProvider>(
    endpoint: string | string[],
    provider: HttpProvider3<A1, A2, A3, T>,
    a1: A1,
    a2: A2,
    a3: A3,
  ): T
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public registerHttpProvider(endpoint: string | string[], provider: any, ...args: any[]): void {
    const p = new provider(
      {
        auth: this.options.auth || AuthType.None,
        commit: this.options.commit,
        password: this.options.password,
      },
      ...args,
    )
    const endpoints = arrayify(endpoint).map(trimSlashes)
    endpoints.forEach((endpoint) => {
      if (/\//.test(endpoint)) {
        throw new Error(`Only top-level endpoints are supported (got ${endpoint})`)
      }
      const existingProvider = this.providers.get(`/${endpoint}`)
      this.providers.set(`/${endpoint}`, p)
      if (existingProvider) {
        logger.debug(`Overridding existing /${endpoint} provider`)
        // If the existing provider isn't registered elsewhere we can dispose.
        if (!Array.from(this.providers.values()).find((p) => p === existingProvider)) {
          logger.debug(`Disposing existing /${endpoint} provider`)
          existingProvider.dispose()
        }
      }
    })
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
    this.heart.beat()
    const route = this.parseUrl(request)
    const write = (payload: HttpResponse): void => {
      response.writeHead(payload.redirect ? HttpCode.Redirect : payload.code || HttpCode.Ok, {
        "Content-Type": payload.mime || getMediaMime(payload.filePath),
        ...(payload.redirect ? { Location: this.constructRedirect(request, route, payload as RedirectResponse) } : {}),
        ...(request.headers["service-worker"] ? { "Service-Worker-Allowed": route.provider.base(route) } : {}),
        ...(payload.cache ? { "Cache-Control": "public, max-age=31536000" } : {}),
        ...(payload.cookie
          ? {
              "Set-Cookie": [
                `${payload.cookie.key}=${payload.cookie.value}`,
                `Path=${normalize(payload.cookie.path || "/", true)}`,
                this.getCookieDomain(request.headers.host || ""),
                // "HttpOnly",
                "SameSite=lax",
              ]
                .filter((l) => !!l)
                .join(";"),
            }
          : {}),
        ...payload.headers,
      })
      if (payload.stream) {
        payload.stream.on("error", (error: NodeJS.ErrnoException) => {
          response.writeHead(error.code === "ENOENT" ? HttpCode.NotFound : HttpCode.ServerError)
          response.end(error.message)
        })
        payload.stream.on("close", () => response.end())
        payload.stream.pipe(response)
      } else if (typeof payload.content === "string" || payload.content instanceof Buffer) {
        response.end(payload.content)
      } else if (payload.content && typeof payload.content === "object") {
        response.end(JSON.stringify(payload.content))
      } else {
        response.end()
      }
    }

    try {
      const payload =
        this.maybeRedirect(request, route) ||
        (route.provider.authenticated(request) && this.maybeProxy(request)) ||
        (await route.provider.handleRequest(route, request))
      if (payload.proxy) {
        this.doProxy(route, request, response, payload.proxy)
      } else {
        write(payload)
      }
    } catch (error) {
      let e = error
      if (error.code === "ENOENT" || error.code === "EISDIR") {
        e = new HttpError("Not found", HttpCode.NotFound)
      }
      const code = typeof e.code === "number" ? e.code : HttpCode.ServerError
      logger.debug("Request error", field("url", request.url), field("code", code), field("error", error))
      if (code >= HttpCode.ServerError) {
        logger.error(error.stack)
      }
      if (request.headers["content-type"] === "application/json") {
        write({
          code,
          mime: "application/json",
          content: {
            error: e.message,
            ...(e.details || {}),
          },
        })
      } else {
        write({
          code,
          ...(await route.provider.getErrorRoot(route, code, code, e.message)),
        })
      }
    }
  }

  /**
   * Return any necessary redirection before delegating to a provider.
   */
  private maybeRedirect(request: http.IncomingMessage, route: ProviderRoute): RedirectResponse | undefined {
    // If we're handling TLS ensure all requests are redirected to HTTPS.
    if (this.options.cert && !(request.connection as tls.TLSSocket).encrypted) {
      return { redirect: route.fullPath }
    }

    return undefined
  }

  /**
   * Given a path that goes from the base, construct a relative redirect URL
   * that will get you there considering that the app may be served from an
   * unknown base path. If handling TLS, also ensure HTTPS.
   */
  private constructRedirect(request: http.IncomingMessage, route: ProviderRoute, payload: RedirectResponse): string {
    const query = {
      ...route.query,
      ...(payload.query || {}),
    }

    Object.keys(query).forEach((key) => {
      if (typeof query[key] === "undefined") {
        delete query[key]
      }
    })

    const secure = (request.connection as tls.TLSSocket).encrypted
    const redirect =
      (this.options.cert && !secure ? `${this.protocol}://${request.headers.host}/` : "") +
      normalize(`${route.provider.base(route)}/${payload.redirect}`, true) +
      (Object.keys(query).length > 0 ? `?${querystring.stringify(query)}` : "")
    logger.debug("redirecting", field("secure", !!secure), field("from", request.url), field("to", redirect))
    return redirect
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

      const route = this.parseUrl(request)
      if (!route.provider) {
        throw new HttpError("Not found", HttpCode.NotFound)
      }

      // The socket proxy is so we can pass them to child processes (TLS sockets
      // can't be transferred so we need an in-between).
      const socketProxy = await this.socketProvider.createProxy(socket)
      const payload =
        this.maybeProxy(request) || (await route.provider.handleWebSocket(route, request, socketProxy, head))
      if (payload && payload.proxy) {
        this.doProxy(route, request, { socket: socketProxy, head }, payload.proxy)
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
      return { base, requestPath }
    }

    const parsedUrl = request.url ? url.parse(request.url, true) : { query: {}, pathname: "" }
    const originalPath = parsedUrl.pathname || "/"
    const fullPath = normalize(originalPath, true)
    const { base, requestPath } = parse(fullPath)

    // Providers match on the path after their base so we need to account for
    // that by shifting the next base out of the request path.
    let provider = this.providers.get(base)
    if (base !== "/" && provider) {
      return { ...parse(requestPath), providerBase: base, fullPath, query: parsedUrl.query, provider, originalPath }
    }

    // Fall back to the top-level provider.
    provider = this.providers.get("/")
    if (!provider) {
      throw new Error(`No provider for ${base}`)
    }
    return { base, providerBase: "/", fullPath, requestPath, query: parsedUrl.query, provider, originalPath }
  }

  /**
   * Proxy a request to the target.
   */
  private doProxy(
    route: Route,
    request: http.IncomingMessage,
    response: http.ServerResponse,
    options: ProxyOptions,
  ): void
  /**
   * Proxy a web socket to the target.
   */
  private doProxy(
    route: Route,
    request: http.IncomingMessage,
    response: { socket: net.Socket; head: Buffer },
    options: ProxyOptions,
  ): void
  /**
   * Proxy a request or web socket to the target.
   */
  private doProxy(
    route: Route,
    request: http.IncomingMessage,
    response: http.ServerResponse | { socket: net.Socket; head: Buffer },
    options: ProxyOptions,
  ): void {
    const port = parseInt(options.port, 10)
    if (isNaN(port)) {
      throw new HttpError(`"${options.port}" is not a valid number`, HttpCode.BadRequest)
    }

    // REVIEW: Absolute redirects need to be based on the subpath but I'm not
    // sure how best to get this information to the `proxyRes` event handler.
    // For now I'm sticking it on the request object which is passed through to
    // the event.
    ;(request as ProxyRequest).base = options.strip

    const isHttp = response instanceof http.ServerResponse
    const base = options.strip ? route.fullPath.replace(options.strip, "") : route.fullPath
    const path = normalize("/" + (options.prepend || "") + "/" + base, true)
    const proxyOptions: proxy.ServerOptions = {
      changeOrigin: true,
      ignorePath: true,
      target: `${isHttp ? "http" : "ws"}://127.0.0.1:${port}${path}${
        Object.keys(route.query).length > 0 ? `?${querystring.stringify(route.query)}` : ""
      }`,
      ws: !isHttp,
    }

    if (response instanceof http.ServerResponse) {
      this.proxy.web(request, response, proxyOptions)
    } else {
      this.proxy.ws(request, response.socket, response.head, proxyOptions)
    }
  }

  /**
   * Get the value that should be used for setting a cookie domain. This will
   * allow the user to authenticate only once. This will use the highest level
   * domain (e.g. `coder.com` over `test.coder.com` if both are specified).
   */
  private getCookieDomain(host: string): string | undefined {
    const idx = host.lastIndexOf(":")
    host = idx !== -1 ? host.substring(0, idx) : host
    if (
      // Might be blank/missing, so there's nothing more to do.
      !host ||
      // IP addresses can't have subdomains so there's no value in setting the
      // domain for them. Assume anything with a : is ipv6 (valid domain name
      // characters are alphanumeric or dashes).
      host.includes(":") ||
      // Assume anything entirely numbers and dots is ipv4 (currently tlds
      // cannot be entirely numbers).
      !/[^0-9.]/.test(host) ||
      // localhost subdomains don't seem to work at all (browser bug?).
      host.endsWith(".localhost") ||
      // It might be localhost (or an IP, see above) if it's a proxy and it
      // isn't setting the host header to match the access domain.
      host === "localhost"
    ) {
      return undefined
    }

    this.proxyDomains.forEach((domain) => {
      if (host.endsWith(domain) && domain.length < host.length) {
        host = domain
      }
    })

    return host ? `Domain=${host}` : undefined
  }

  /**
   * Return a response if the request should be proxied. Anything that ends in a
   * proxy domain and has a *single* subdomain should be proxied. Anything else
   * should return `undefined` and will be handled as normal.
   *
   * For example if `coder.com` is specified `8080.coder.com` will be proxied
   * but `8080.test.coder.com` and `test.8080.coder.com` will not.
   */
  public maybeProxy(request: http.IncomingMessage): HttpResponse | undefined {
    // Split into parts.
    const host = request.headers.host || ""
    const idx = host.indexOf(":")
    const domain = idx !== -1 ? host.substring(0, idx) : host
    const parts = domain.split(".")

    // There must be an exact match.
    const port = parts.shift()
    const proxyDomain = parts.join(".")
    if (!port || !this.proxyDomains.has(proxyDomain)) {
      return undefined
    }

    return {
      proxy: {
        port,
      },
    }
  }
}
