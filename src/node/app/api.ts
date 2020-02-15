import { field, logger } from "@coder/logger"
import * as cp from "child_process"
import * as http from "http"
import * as net from "net"
import * as WebSocket from "ws"
import {
  Application,
  ApplicationsResponse,
  ClientMessage,
  RecentResponse,
  ServerMessage,
  SessionError,
  SessionResponse,
} from "../../common/api"
import { ApiEndpoint, HttpCode } from "../../common/http"
import { normalize } from "../../common/util"
import { HttpProvider, HttpProviderOptions, HttpResponse, HttpServer, Route } from "../http"
import { findApplications, findWhitelistedApplications } from "./bin"

interface ServerSession {
  process?: cp.ChildProcess
  readonly app: Application
}

/**
 * API HTTP provider.
 */
export class ApiHttpProvider extends HttpProvider {
  private readonly ws = new WebSocket.Server({ noServer: true })
  private readonly sessions = new Map<string, ServerSession>()

  public constructor(options: HttpProviderOptions, private readonly server: HttpServer) {
    super(options)
  }

  public dispose(): void {
    this.sessions.forEach((s) => {
      if (s.process) {
        s.process.kill()
      }
    })
  }

  public async handleRequest(route: Route, request: http.IncomingMessage): Promise<HttpResponse | undefined> {
    if (!this.authenticated(request)) {
      return { code: HttpCode.Unauthorized }
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
    }
    return undefined
  }

  public async handleWebSocket(
    route: Route,
    request: http.IncomingMessage,
    socket: net.Socket,
    head: Buffer,
  ): Promise<true | undefined> {
    if (!this.authenticated(request)) {
      throw new Error("not authenticated")
    }
    switch (route.base) {
      case ApiEndpoint.status:
        return this.handleStatusSocket(request, socket, head)
      case ApiEndpoint.run:
        return this.handleRunSocket(route, request, socket, head)
    }
    return undefined
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
  private async session(request: http.IncomingMessage): Promise<HttpResponse | undefined> {
    this.ensureMethod(request, ["DELETE", "POST"])

    const data = await this.getData(request)
    if (!data) {
      return undefined
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

    return undefined
  }

  /**
   * Kill a session identified by `app.sessionId`.
   */
  public deleteSession(sessionId: string): HttpResponse {
    logger.debug("deleting session", field("sessionId", sessionId))
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
   * Return recent sessions.
   */
  public async recent(): Promise<RecentResponse> {
    return {
      recent: [], // TODO
      running: Array.from(this.sessions).map(([sessionId, session]) => ({
        ...session.app,
        sessionId,
      })),
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
