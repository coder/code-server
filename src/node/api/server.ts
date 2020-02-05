import { field, logger } from "@coder/logger"
import * as http from "http"
import * as net from "net"
import * as ws from "ws"
import {
  ApplicationsResponse,
  ClientMessage,
  FilesResponse,
  LoginRequest,
  LoginResponse,
  ServerMessage,
} from "../../common/api"
import { ApiEndpoint, HttpCode } from "../../common/http"
import { normalize } from "../../common/util"
import { HttpProvider, HttpProviderOptions, HttpResponse, HttpServer, Route } from "../http"
import { hash } from "../util"

/**
 * API HTTP provider.
 */
export class ApiHttpProvider extends HttpProvider {
  private readonly ws = new ws.Server({ noServer: true })

  public constructor(options: HttpProviderOptions, private readonly server: HttpServer) {
    super(options)
  }

  public async handleRequest(route: Route, request: http.IncomingMessage): Promise<HttpResponse | undefined> {
    switch (route.base) {
      case ApiEndpoint.login:
        if (request.method === "POST") {
          return this.login(request)
        }
        break
      default:
        if (!this.authenticated(request)) {
          return { code: HttpCode.Unauthorized }
        }
        switch (route.base) {
          case ApiEndpoint.applications:
            return this.applications()
          case ApiEndpoint.files:
            return this.files()
        }
    }
    return undefined
  }

  public async handleWebSocket(
    _route: Route,
    request: http.IncomingMessage,
    socket: net.Socket,
    head: Buffer
  ): Promise<true> {
    if (!this.authenticated(request)) {
      throw new Error("not authenticated")
    }
    await new Promise<ws>((resolve) => {
      this.ws.handleUpgrade(request, socket, head, (ws) => {
        const send = (event: ServerMessage): void => {
          ws.send(JSON.stringify(event))
        }
        ws.on("message", (data) => {
          logger.trace("got message", field("message", data))
          try {
            const message: ClientMessage = JSON.parse(data.toString())
            this.getMessageResponse(message.event).then(send)
          } catch (error) {
            logger.error(error.message, field("message", data))
          }
        })
        resolve()
      })
    })
    return true
  }

  private async getMessageResponse(event: "health"): Promise<ServerMessage> {
    switch (event) {
      case "health":
        return { event, connections: await this.server.getConnections() }
      default:
        throw new Error("unexpected message")
    }
  }

  /**
   * Return OK and a cookie if the user is authenticated otherwise return
   * unauthorized.
   */
  private async login(request: http.IncomingMessage): Promise<HttpResponse<LoginResponse>> {
    // Already authenticated via cookies?
    const providedPassword = this.authenticated(request)
    if (providedPassword) {
      return { code: HttpCode.Ok }
    }

    const data = await this.getData(request)
    const payload: LoginRequest = data ? JSON.parse(data) : {}
    const password = this.authenticated(request, {
      key: typeof payload.password === "string" ? [hash(payload.password)] : undefined,
    })
    if (password) {
      return {
        content: {
          success: true,
        },
        cookie:
          typeof password === "string"
            ? {
                key: "key",
                value: password,
                path: normalize(payload.basePath),
              }
            : undefined,
      }
    }

    // Only log if it was an actual login attempt.
    if (payload && payload.password) {
      console.error(
        "Failed login attempt",
        JSON.stringify({
          xForwardedFor: request.headers["x-forwarded-for"],
          remoteAddress: request.connection.remoteAddress,
          userAgent: request.headers["user-agent"],
          timestamp: Math.floor(new Date().getTime() / 1000),
        })
      )
    }

    return { code: HttpCode.Unauthorized }
  }

  /**
   * Return files at the requested directory.
   */
  private async files(): Promise<HttpResponse<FilesResponse>> {
    return {
      content: {
        files: [],
      },
    }
  }

  /**
   * Return available applications.
   */
  private async applications(): Promise<HttpResponse<ApplicationsResponse>> {
    return {
      content: {
        applications: [
          {
            name: "VS Code",
            path: "/vscode",
            embedPath: "/vscode-embed",
          },
        ],
      },
    }
  }
}
