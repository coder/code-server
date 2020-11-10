import { field, logger } from "@coder/logger"
import * as cp from "child_process"
import * as net from "net"
import * as path from "path"
import * as ipc from "../../lib/vscode/src/vs/server/ipc"
import { arrayify, generateUuid } from "../common/util"
import { rootPath } from "./constants"
import { settings } from "./settings"
import { isFile } from "./util"
import { ipcMain } from "./wrapper"

export class VscodeProvider {
  public readonly serverRootPath: string
  public readonly vsRootPath: string
  private _vscode?: Promise<cp.ChildProcess>
  private timeoutInterval = 10000 // 10s, matches VS Code's timeouts.

  public constructor() {
    this.vsRootPath = path.resolve(rootPath, "lib/vscode")
    this.serverRootPath = path.join(this.vsRootPath, "out/vs/server")
    ipcMain.onDispose(() => this.dispose())
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

    const message = await this.onMessage<ipc.OptionsMessage>(vscode, (message): message is ipc.OptionsMessage => {
      // There can be parallel initializations so wait for the right ID.
      return message.type === "options" && message.id === id
    })

    return message.options
  }

  private fork(): Promise<cp.ChildProcess> {
    if (this._vscode) {
      return this._vscode
    }

    logger.debug("forking vs code...")
    const vscode = cp.fork(path.join(this.serverRootPath, "fork"))

    const dispose = () => {
      vscode.removeAllListeners()
      vscode.kill()
      this._vscode = undefined
    }

    vscode.on("error", (error: Error) => {
      logger.error(error.message)
      if (error.stack) {
        logger.debug(error.stack)
      }
      dispose()
    })

    vscode.on("exit", (code) => {
      logger.error(`VS Code exited unexpectedly with code ${code}`)
      dispose()
    })

    this._vscode = this.onMessage<ipc.ReadyMessage>(vscode, (message): message is ipc.ReadyMessage => {
      return message.type === "ready"
    }).then(() => vscode)

    return this._vscode
  }

  /**
   * Listen to a single message from a process. Reject if the process errors,
   * exits, or times out.
   *
   * `fn` is a function that determines whether the message is the one we're
   * waiting for.
   */
  private onMessage<T extends ipc.VscodeMessage>(
    proc: cp.ChildProcess,
    fn: (message: ipc.VscodeMessage) => message is T,
  ): Promise<T> {
    return new Promise((resolve, _reject) => {
      const reject = (error: Error) => {
        clearTimeout(timeout)
        _reject(error)
      }

      const onExit = (code: number | null) => {
        reject(new Error(`VS Code exited unexpectedly with code ${code}`))
      }

      const timeout = setTimeout(() => {
        reject(new Error("timed out"))
      }, this.timeoutInterval)

      proc.on("message", (message: ipc.VscodeMessage) => {
        logger.debug("got message from vscode", field("message", message))
        proc.off("error", reject)
        proc.off("exit", onExit)
        if (fn(message)) {
          clearTimeout(timeout)
          resolve(message)
        }
      })

      proc.once("error", reject)
      proc.once("exit", onExit)
    })
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
