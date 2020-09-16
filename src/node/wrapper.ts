import { field, logger } from "@coder/logger"
import * as cp from "child_process"
import * as path from "path"
import * as rfs from "rotating-file-stream"
import { Emitter } from "../common/emitter"
import { paths } from "./util"

interface HandshakeMessage {
  type: "handshake"
}

interface RelaunchMessage {
  type: "relaunch"
  version: string
}

export type Message = RelaunchMessage | HandshakeMessage

export class ProcessError extends Error {
  public constructor(message: string, public readonly code: number | undefined) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Allows the wrapper and inner processes to communicate.
 */
export class IpcMain {
  private readonly _onMessage = new Emitter<Message>()
  public readonly onMessage = this._onMessage.event
  private readonly _onDispose = new Emitter<NodeJS.Signals | undefined>()
  public readonly onDispose = this._onDispose.event
  public readonly processExit: (code?: number) => never

  public constructor(public readonly parentPid?: number) {
    process.on("SIGINT", () => this._onDispose.emit("SIGINT"))
    process.on("SIGTERM", () => this._onDispose.emit("SIGTERM"))
    process.on("exit", () => this._onDispose.emit(undefined))

    // Ensure we control when the process exits.
    this.processExit = process.exit
    process.exit = function (code?: number) {
      logger.warn(`process.exit() was prevented: ${code || "unknown code"}.`)
    } as (code?: number) => never

    this.onDispose((signal) => {
      // Remove listeners to avoid possibly triggering disposal again.
      process.removeAllListeners()

      // Let any other handlers run first then exit.
      logger.debug(`${parentPid ? "inner process" : "wrapper"} ${process.pid} disposing`, field("code", signal))
      setTimeout(() => this.exit(0), 0)
    })

    // Kill the inner process if the parent dies. This is for the case where the
    // parent process is forcefully terminated and cannot clean up.
    if (parentPid) {
      setInterval(() => {
        try {
          // process.kill throws an exception if the process doesn't exist.
          process.kill(parentPid, 0)
        } catch (_) {
          // Consider this an error since it should have been able to clean up
          // the child process unless it was forcefully killed.
          logger.error(`parent process ${parentPid} died`)
          this._onDispose.emit(undefined)
        }
      }, 5000)
    }
  }

  public exit(error?: number | ProcessError): never {
    if (error && typeof error !== "number") {
      this.processExit(typeof error.code === "number" ? error.code : 1)
    } else {
      this.processExit(error)
    }
  }

  public handshake(child?: cp.ChildProcess): Promise<void> {
    return new Promise((resolve, reject) => {
      const target = child || process
      const onMessage = (message: Message): void => {
        logger.debug(
          `${child ? "wrapper" : "inner process"} ${process.pid} received message from ${
            child ? child.pid : this.parentPid
          }`,
          field("message", message),
        )
        if (message.type === "handshake") {
          target.removeListener("message", onMessage)
          target.on("message", (msg) => this._onMessage.emit(msg))
          // The wrapper responds once the inner process starts the handshake.
          if (child) {
            if (!target.send) {
              throw new Error("child not spawned with IPC")
            }
            target.send({ type: "handshake" })
          }
          resolve()
        }
      }
      target.on("message", onMessage)
      if (child) {
        child.once("error", reject)
        child.once("exit", (code) => {
          reject(new ProcessError(`Unexpected exit with code ${code}`, code !== null ? code : undefined))
        })
      } else {
        // The inner process initiates the handshake.
        this.send({ type: "handshake" })
      }
    })
  }

  public relaunch(version: string): void {
    this.send({ type: "relaunch", version })
  }

  private send(message: Message): void {
    if (!process.send) {
      throw new Error("not spawned with IPC")
    }
    process.send(message)
  }
}

let _ipcMain: IpcMain
export const ipcMain = (): IpcMain => {
  if (!_ipcMain) {
    _ipcMain = new IpcMain(
      typeof process.env.CODE_SERVER_PARENT_PID !== "undefined"
        ? parseInt(process.env.CODE_SERVER_PARENT_PID)
        : undefined,
    )
  }
  return _ipcMain
}

export interface WrapperOptions {
  maxMemory?: number
  nodeOptions?: string
}

/**
 * Provides a way to wrap a process for the purpose of updating the running
 * instance.
 */
export class WrapperProcess {
  private process?: cp.ChildProcess
  private started?: Promise<void>
  private readonly logStdoutStream: rfs.RotatingFileStream
  private readonly logStderrStream: rfs.RotatingFileStream

  public constructor(private currentVersion: string, private readonly options?: WrapperOptions) {
    const opts = {
      size: "10M",
      maxFiles: 10,
    }
    this.logStdoutStream = rfs.createStream(path.join(paths.data, "coder-logs", "code-server-stdout.log"), opts)
    this.logStderrStream = rfs.createStream(path.join(paths.data, "coder-logs", "code-server-stderr.log"), opts)

    ipcMain().onDispose(() => {
      if (this.process) {
        this.process.removeAllListeners()
        this.process.kill()
      }
    })

    ipcMain().onMessage((message) => {
      switch (message.type) {
        case "relaunch":
          logger.info(`Relaunching: ${this.currentVersion} -> ${message.version}`)
          this.currentVersion = message.version
          this.relaunch()
          break
        default:
          logger.error(`Unrecognized message ${message}`)
          break
      }
    })

    process.on("SIGUSR1", async () => {
      logger.info("Received SIGUSR1; hotswapping")
      this.relaunch()
    })
  }

  private async relaunch(): Promise<void> {
    this.started = undefined
    if (this.process) {
      this.process.removeAllListeners()
      this.process.kill()
    }
    try {
      await this.start()
    } catch (error) {
      logger.error(error.message)
      ipcMain().exit(typeof error.code === "number" ? error.code : 1)
    }
  }

  public start(): Promise<void> {
    if (!this.started) {
      this.started = this.spawn().then((child) => {
        // Log both to stdout and to the log directory.
        if (child.stdout) {
          child.stdout.pipe(this.logStdoutStream)
          child.stdout.pipe(process.stdout)
        }
        if (child.stderr) {
          child.stderr.pipe(this.logStderrStream)
          child.stderr.pipe(process.stderr)
        }
        logger.debug(`spawned inner process ${child.pid}`)
        ipcMain()
          .handshake(child)
          .then(() => {
            child.once("exit", (code) => {
              logger.debug(`inner process ${child.pid} exited unexpectedly`)
              ipcMain().exit(code || 0)
            })
          })
        this.process = child
      })
    }
    return this.started
  }

  private async spawn(): Promise<cp.ChildProcess> {
    // Flags to pass along to the Node binary.
    let nodeOptions = `${process.env.NODE_OPTIONS || ""} ${(this.options && this.options.nodeOptions) || ""}`
    if (!/max_old_space_size=(\d+)/g.exec(nodeOptions)) {
      nodeOptions += ` --max_old_space_size=${(this.options && this.options.maxMemory) || 2048}`
    }

    // Use spawn (instead of fork) to use the new binary in case it was updated.
    return cp.spawn(process.argv[0], process.argv.slice(1), {
      env: {
        ...process.env,
        CODE_SERVER_PARENT_PID: process.pid.toString(),
        NODE_OPTIONS: nodeOptions,
      },
      stdio: ["ipc"],
    })
  }
}

// It's possible that the pipe has closed (for example if you run code-server
// --version | head -1). Assume that means we're done.
if (!process.stdout.isTTY) {
  process.stdout.on("error", () => ipcMain().exit())
}

export const wrap = (fn: () => Promise<void>): void => {
  if (ipcMain().parentPid) {
    ipcMain()
      .handshake()
      .then(() => fn())
      .catch((error: ProcessError): void => {
        logger.error(error.message)
        ipcMain().exit(error)
      })
  } else {
    const wrapper = new WrapperProcess(require("../../package.json").version)
    wrapper.start().catch((error) => {
      logger.error(error.message)
      ipcMain().exit(error)
    })
  }
}
