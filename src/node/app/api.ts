import { field, logger } from "@coder/logger"
import * as cp from "child_process"
import * as fs from "fs-extra"
import * as http from "http"
import * as net from "net"
import * as path from "path"
import * as url from "url"
import * as WebSocket from "ws"
import {
  Application,
  ApplicationsResponse,
  ClientMessage,
  RecentResponse,
  RunningResponse,
  ServerMessage,
  SessionError,
  SessionResponse,
} from "../../common/api"
import { ApiEndpoint, HttpCode, HttpError } from "../../common/http"
import { normalize } from "../../common/util"
import { HttpProvider, HttpProviderOptions, HttpResponse, HttpServer, Route } from "../http"
import { findApplications, findWhitelistedApplications, Vscode } from "./bin"
import { VscodeHttpProvider } from "./vscode"

interface ServerSession {
  process?: cp.ChildProcess
  readonly app: Application
}

interface VsRecents {
  [key: string]: (string | { configURIPath: string })[]
}

type VsSettings = [string, string][]

/**
 * API HTTP provider.
 */
export class ApiHttpProvider extends HttpProvider {
  private readonly ws = new WebSocket.Server({ noServer: true })
  private readonly sessions = new Map<string, ServerSession>()

  public constructor(
    options: HttpProviderOptions,
    private readonly server: HttpServer,
    private readonly vscode: VscodeHttpProvider,
    private readonly dataDir?: string,
  ) {
    super(options)
  }

  public dispose(): void {
    this.sessions.forEach((s) => {
      if (s.process) {
        s.process.kill()
      }
    })
  }

  public async handleRequest(route: Route, request: http.IncomingMessage): Promise<HttpResponse> {
    this.ensureAuthenticated(request)
    if (route.requestPath !== "/index.html") {
      throw new HttpError("Not found", HttpCode.NotFound)
    }

    switch (route.base) {
      case ApiEndpoint.applications:
        this.ensureMethod(request)
        return {
          content: {
            applications: await this.applications(),
          },
        } as HttpResponse<ApplicationsResponse>
      case ApiEndpoint.session:
        return this.session(request)
      case ApiEndpoint.recent:
        this.ensureMethod(request)
        return {
          content: await this.recent(),
        } as HttpResponse<RecentResponse>
      case ApiEndpoint.running:
        this.ensureMethod(request)
        return {
          content: await this.running(),
        } as HttpResponse<RunningResponse>
    }

    throw new HttpError("Not found", HttpCode.NotFound)
  }

  public async handleWebSocket(
    route: Route,
    request: http.IncomingMessage,
    socket: net.Socket,
    head: Buffer,
  ): Promise<true> {
    if (!this.authenticated(request)) {
      throw new Error("not authenticated")
    }
    switch (route.base) {
      case ApiEndpoint.status:
        return this.handleStatusSocket(request, socket, head)
      case ApiEndpoint.run:
        return this.handleRunSocket(route, request, socket, head)
    }

    throw new HttpError("Not found", HttpCode.NotFound)
  }

  private async handleStatusSocket(request: http.IncomingMessage, socket: net.Socket, head: Buffer): Promise<true> {
    const getMessageResponse = async (event: "health"): Promise<ServerMessage> => {
      switch (event) {
        case "health":
          return { event, connections: await this.server.getConnections() }
        default:
          throw new Error("unexpected message")
      }
    }

    await new Promise<WebSocket>((resolve) => {
      this.ws.handleUpgrade(request, socket, head, (ws) => {
        const send = (event: ServerMessage): void => {
          ws.send(JSON.stringify(event))
        }
        ws.on("message", (data) => {
          logger.trace("got message", field("message", data))
          try {
            const message: ClientMessage = JSON.parse(data.toString())
            getMessageResponse(message.event).then(send)
          } catch (error) {
            logger.error(error.message, field("message", data))
          }
        })
        resolve()
      })
    })

    return true
  }

  /**
   * A socket that connects to a session.
   */
  private async handleRunSocket(
    route: Route,
    request: http.IncomingMessage,
    socket: net.Socket,
    head: Buffer,
  ): Promise<true> {
    const sessionId = route.requestPath.replace(/^\//, "")
    logger.debug("connecting session", field("sessionId", sessionId))
    const ws = await new Promise<WebSocket>((resolve, reject) => {
      this.ws.handleUpgrade(request, socket, head, (socket) => {
        socket.binaryType = "arraybuffer"

        const session = this.sessions.get(sessionId)
        if (!session) {
          socket.close(SessionError.NotFound)
          return reject(new Error("session not found"))
        }

        resolve(socket as WebSocket)

        socket.on("error", (error) => {
          socket.close(SessionError.FailedToStart)
          logger.error("got error while connecting socket", field("error", error))
          reject(error)
        })
      })
    })

    // Send ready message.
    ws.send(
      Buffer.from(
        JSON.stringify({
          protocol: "TODO",
        }),
      ),
    )

    return true
  }

  /**
   * Return whitelisted applications.
   */
  public async applications(): Promise<ReadonlyArray<Application>> {
    return findWhitelistedApplications()
  }

  /**
   * Return installed applications.
   */
  public async installedApplications(): Promise<ReadonlyArray<Application>> {
    return findApplications()
  }

  /**
   * Get a running application.
   */
  public getRunningApplication(sessionIdOrPath?: string): Application | undefined {
    if (!sessionIdOrPath) {
      return undefined
    }

    const sessionId = sessionIdOrPath.replace(/\//g, "")
    let session = this.sessions.get(sessionId)
    if (session) {
      logger.debug("found application by session id", field("id", sessionId))
      return session.app
    }

    const base = normalize("/" + sessionIdOrPath)
    session = Array.from(this.sessions.values()).find((s) => s.app.path === base)
    if (session) {
      logger.debug("found application by path", field("path", base))
      return session.app
    }

    logger.debug("no application found matching route", field("route", sessionIdOrPath))
    return undefined
  }

  /**
   * Handle /session endpoint.
   */
  private async session(request: http.IncomingMessage): Promise<HttpResponse> {
    this.ensureMethod(request, ["DELETE", "POST"])

    const data = await this.getData(request)
    if (!data) {
      throw new HttpError("Not found", HttpCode.NotFound)
    }

    switch (request.method) {
      case "DELETE":
        return this.deleteSession(JSON.parse(data).sessionId)
      case "POST": {
        // Prevent spawning the same app multiple times.
        const parsed: Application = JSON.parse(data)
        const app = this.getRunningApplication(parsed.sessionId || parsed.path)
        if (app) {
          return {
            content: {
              created: false,
              sessionId: app.sessionId,
            },
          } as HttpResponse<SessionResponse>
        }
        return {
          content: {
            created: true,
            sessionId: await this.createSession(parsed),
          },
        } as HttpResponse<SessionResponse>
      }
    }

    throw new HttpError("Not found", HttpCode.NotFound)
  }

  /**
   * Kill a session identified by `app.sessionId`.
   */
  public async deleteSession(sessionId: string): Promise<HttpResponse> {
    logger.debug("deleting session", field("sessionId", sessionId))
    switch (sessionId) {
      case "vscode":
        await this.vscode.dispose()
        return { code: HttpCode.Ok }
      default: {
        const session = this.sessions.get(sessionId)
        if (!session) {
          throw new Error("session does not exist")
        }
        if (session.process) {
          session.process.kill()
        }
        this.sessions.delete(sessionId)
        return { code: HttpCode.Ok }
      }
    }
  }

  /**
   * Create a new session and return the session ID.
   */
  public async createSession(app: Application): Promise<string> {
    const sessionId = Math.floor(Math.random() * 10000).toString()
    if (this.sessions.has(sessionId)) {
      throw new Error("conflicting session id")
    }

    if (!app.exec) {
      throw new Error("cannot execute application with no `exec`")
    }

    const appSession: ServerSession = {
      app: {
        ...app,
        sessionId,
      },
    }
    this.sessions.set(sessionId, appSession)

    try {
      throw new Error("TODO")
    } catch (error) {
      this.sessions.delete(sessionId)
      throw error
    }
  }

  /**
   * Return VS Code's recent paths.
   */
  public async recent(): Promise<RecentResponse> {
    try {
      if (!this.dataDir) {
        throw new Error("data directory is not set")
      }

      const state: VsSettings = JSON.parse(await fs.readFile(path.join(this.dataDir, "User/state/global.json"), "utf8"))
      const setting = Array.isArray(state) && state.find((item) => item[0] === "recently.opened")
      if (!setting) {
        throw new Error("settings appear malformed")
      }

      const pathPromises: { [key: string]: Promise<string> } = {}
      const workspacePromises: { [key: string]: Promise<string> } = {}
      Object.values(JSON.parse(setting[1]) as VsRecents).forEach((recents) => {
        recents.forEach((recent) => {
          try {
            const target = typeof recent === "string" ? pathPromises : workspacePromises
            const pathname = url.parse(typeof recent === "string" ? recent : recent.configURIPath).pathname
            if (pathname && !target[pathname]) {
              target[pathname] = new Promise<string>((resolve) => {
                fs.stat(pathname)
                  .then(() => resolve(pathname))
                  .catch(() => resolve())
              })
            }
          } catch (error) {
            logger.debug("invalid path", field("path", recent))
          }
        })
      })

      const [paths, workspaces] = await Promise.all([
        Promise.all(Object.values(pathPromises)),
        Promise.all(Object.values(workspacePromises)),
      ])

      return {
        paths: paths.filter((p) => !!p),
        workspaces: workspaces.filter((p) => !!p),
      }
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error
      }
    }

    return { paths: [], workspaces: [] }
  }

  /**
   * Return running sessions.
   */
  public async running(): Promise<RunningResponse> {
    return {
      applications: (this.vscode.running
        ? [
            {
              ...Vscode,
              sessionId: "vscode",
            },
          ]
        : []
      ).concat(
        Array.from(this.sessions).map(([sessionId, session]) => ({
          ...session.app,
          sessionId,
        })),
      ),
    }
  }

  /**
   * For these, just return the error message since they'll be requested as
   * JSON.
   */
  public async getErrorRoot(_route: Route, _title: string, _header: string, error: string): Promise<HttpResponse> {
    return {
      content: JSON.stringify({ error }),
    }
  }
}
