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
  ServerMessage,
  SessionError,
  SessionResponse,
} from "../../common/api"
import { ApiEndpoint, HttpCode, HttpError } from "../../common/http"
import { HttpProvider, HttpProviderOptions, HttpResponse, HttpServer, Route } from "../http"
import { findApplications, findWhitelistedApplications, Vscode } from "./bin"
import { VscodeHttpProvider } from "./vscode"

interface VsRecents {
  [key: string]: (string | { configURIPath: string })[]
}

type VsSettings = [string, string][]

/**
 * API HTTP provider.
 */
export class ApiHttpProvider extends HttpProvider {
  private readonly ws = new WebSocket.Server({ noServer: true })

  public constructor(
    options: HttpProviderOptions,
    private readonly server: HttpServer,
    private readonly vscode: VscodeHttpProvider,
    private readonly dataDir?: string,
  ) {
    super(options)
  }

  public async handleRequest(route: Route, request: http.IncomingMessage): Promise<HttpResponse> {
    this.ensureAuthenticated(request)
    if (!this.isRoot(route)) {
      throw new HttpError("Not found", HttpCode.NotFound)
    }

    switch (route.base) {
      case ApiEndpoint.applications:
        this.ensureMethod(request)
        return {
          mime: "application/json",
          content: {
            applications: await this.applications(),
          },
        } as HttpResponse<ApplicationsResponse>
      case ApiEndpoint.process:
        return this.process(request)
      case ApiEndpoint.recent:
        this.ensureMethod(request)
        return {
          mime: "application/json",
          content: await this.recent(),
        } as HttpResponse<RecentResponse>
    }

    throw new HttpError("Not found", HttpCode.NotFound)
  }

  public async handleWebSocket(
    route: Route,
    request: http.IncomingMessage,
    socket: net.Socket,
    head: Buffer,
  ): Promise<void> {
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

  private async handleStatusSocket(request: http.IncomingMessage, socket: net.Socket, head: Buffer): Promise<void> {
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
  }

  /**
   * A socket that connects to the process.
   */
  private async handleRunSocket(
    _route: Route,
    request: http.IncomingMessage,
    socket: net.Socket,
    head: Buffer,
  ): Promise<void> {
    logger.debug("connecting to process")
    const ws = await new Promise<WebSocket>((resolve, reject) => {
      this.ws.handleUpgrade(request, socket, head, (socket) => {
        socket.binaryType = "arraybuffer"

        socket.on("error", (error) => {
          socket.close(SessionError.FailedToStart)
          logger.error("got error while connecting socket", field("error", error))
          reject(error)
        })

        resolve(socket as WebSocket)
      })
    })

    logger.debug("connected to process")

    // Send ready message.
    ws.send(
      Buffer.from(
        JSON.stringify({
          protocol: "TODO",
        }),
      ),
    )
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
   * Handle /process endpoint.
   */
  private async process(request: http.IncomingMessage): Promise<HttpResponse> {
    this.ensureMethod(request, ["DELETE", "POST"])

    const data = await this.getData(request)
    if (!data) {
      throw new HttpError("No data was provided", HttpCode.BadRequest)
    }

    const parsed: Application = JSON.parse(data)

    switch (request.method) {
      case "DELETE":
        if (parsed.pid) {
          await this.killProcess(parsed.pid)
        } else if (parsed.path) {
          await this.killProcess(parsed.path)
        } else {
          throw new Error("No pid or path was provided")
        }
        return {
          mime: "application/json",
          code: HttpCode.Ok,
        }
      case "POST": {
        if (!parsed.exec) {
          throw new Error("No exec was provided")
        }
        return {
          mime: "application/json",
          content: {
            created: true,
            pid: await this.spawnProcess(parsed.exec),
          },
        } as HttpResponse<SessionResponse>
      }
    }

    throw new HttpError("Not found", HttpCode.NotFound)
  }

  /**
   * Kill a process identified by pid or path if a web app.
   */
  public async killProcess(pid: number | string): Promise<void> {
    if (typeof pid === "string") {
      switch (pid) {
        case Vscode.path:
          await this.vscode.dispose()
          break
        default:
          throw new Error(`Process "${pid}" does not exist`)
      }
    } else {
      process.kill(pid)
    }
  }

  /**
   * Spawn a process and return the pid.
   */
  public async spawnProcess(exec: string): Promise<number> {
    const proc = cp.spawn(exec, {
      shell: process.env.SHELL || true,
      env: {
        ...process.env,
      },
    })

    proc.on("error", (error) => logger.error("process errored", field("pid", proc.pid), field("error", error)))
    proc.on("exit", () => logger.debug("process exited", field("pid", proc.pid)))

    logger.debug("started process", field("pid", proc.pid))

    return proc.pid
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
        return { paths: [], workspaces: [] }
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
   * For these, just return the error message since they'll be requested as
   * JSON.
   */
  public async getErrorRoot(_route: Route, _title: string, _header: string, error: string): Promise<HttpResponse> {
    return {
      mime: "application/json",
      content: JSON.stringify({ error }),
    }
  }
}
