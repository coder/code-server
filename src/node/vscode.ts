import { field, logger } from "@coder/logger"
import * as cp from "child_process"
import * as fs from "fs-extra"
import * as net from "net"
import * as path from "path"
import * as ipc from "../../lib/vscode/src/vs/server/ipc"
import { arrayify, generateUuid } from "../common/util"
import { rootPath } from "./constants"
import { settings } from "./settings"

export class VscodeProvider {
  public readonly serverRootPath: string
  public readonly vsRootPath: string
  private _vscode?: Promise<cp.ChildProcess>

  public constructor() {
    this.vsRootPath = path.resolve(rootPath, "lib/vscode")
    this.serverRootPath = path.join(this.vsRootPath, "out/vs/server")
  }

  public async dispose(): Promise<void> {
    if (this._vscode) {
      const vscode = await this._vscode
      vscode.removeAllListeners()
      vscode.kill()
      this._vscode = undefined
    }
  }

  public async initialize(
    options: Omit<ipc.VscodeOptions, "startPath">,
    query: ipc.Query,
  ): Promise<ipc.WorkbenchOptions> {
    const { lastVisited } = await settings.read()
    const startPath = await this.getFirstPath([
      { url: query.workspace, workspace: true },
      { url: query.folder, workspace: false },
      options.args._ && options.args._.length > 0
        ? { url: path.resolve(options.args._[options.args._.length - 1]) }
        : undefined,
      lastVisited,
    ])

    settings.write({
      lastVisited: startPath,
      query,
    })

    const id = generateUuid()
    const vscode = await this.fork()

    logger.debug("setting up vs code...")
    return new Promise<ipc.WorkbenchOptions>((resolve, reject) => {
      vscode.once("message", (message: ipc.VscodeMessage) => {
        logger.debug("got message from vs code", field("message", message))
        return message.type === "options" && message.id === id
          ? resolve(message.options)
          : reject(new Error("Unexpected response during initialization"))
      })
      vscode.once("error", reject)
      vscode.once("exit", (code) => reject(new Error(`VS Code exited unexpectedly with code ${code}`)))
      this.send(
        {
          type: "init",
          id,
          options: {
            ...options,
            startPath,
          },
        },
        vscode,
      )
    })
  }

  private fork(): Promise<cp.ChildProcess> {
    if (!this._vscode) {
      logger.debug("forking vs code...")
      const vscode = cp.fork(path.join(this.serverRootPath, "fork"))
      vscode.on("error", (error) => {
        logger.error(error.message)
        this._vscode = undefined
      })
      vscode.on("exit", (code) => {
        logger.error(`VS Code exited unexpectedly with code ${code}`)
        this._vscode = undefined
      })

      this._vscode = new Promise((resolve, reject) => {
        vscode.once("message", (message: ipc.VscodeMessage) => {
          logger.debug("got message from vs code", field("message", message))
          return message.type === "ready"
            ? resolve(vscode)
            : reject(new Error("Unexpected response waiting for ready response"))
        })
        vscode.once("error", reject)
        vscode.once("exit", (code) => reject(new Error(`VS Code exited unexpectedly with code ${code}`)))
      })
    }

    return this._vscode
  }

  /**
   * VS Code expects a raw socket. It will handle all the web socket frames.
   */
  public async sendWebsocket(socket: net.Socket, query: ipc.Query): Promise<void> {
    // TODO: TLS socket proxy.
    const vscode = await this._vscode
    this.send({ type: "socket", query }, vscode, socket)
  }

  private send(message: ipc.CodeServerMessage, vscode?: cp.ChildProcess, socket?: net.Socket): void {
    if (!vscode || vscode.killed) {
      throw new Error("vscode is not running")
    }
    vscode.send(message, socket)
  }

  /**
   * Choose the first non-empty path.
   */
  private async getFirstPath(
    startPaths: Array<{ url?: string | string[] | ipc.Query | ipc.Query[]; workspace?: boolean } | undefined>,
  ): Promise<ipc.StartPath | undefined> {
    const isFile = async (path: string): Promise<boolean> => {
      try {
        const stat = await fs.stat(path)
        return stat.isFile()
      } catch (error) {
        logger.warn(error.message)
        return false
      }
    }
    for (let i = 0; i < startPaths.length; ++i) {
      const startPath = startPaths[i]
      const url = arrayify(startPath && startPath.url).find((p) => !!p)
      if (startPath && url && typeof url === "string") {
        return {
          url,
          // The only time `workspace` is undefined is for the command-line
          // argument, in which case it's a path (not a URL) so we can stat it
          // without having to parse it.
          workspace: typeof startPath.workspace !== "undefined" ? startPath.workspace : await isFile(url),
        }
      }
    }
    return undefined
  }
}
