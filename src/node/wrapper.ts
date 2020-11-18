import { Logger, field, logger } from "@coder/logger"
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

type Message = RelaunchMessage | HandshakeMessage

class ProcessError extends Error {
  public constructor(message: string, public readonly code: number | undefined) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Wrapper around a process that tries to gracefully exit when a process exits
 * and provides a way to prevent `process.exit`.
 */
abstract class Process {
  /**
   * Emit this to trigger a graceful exit.
   */
  protected readonly _onDispose = new Emitter<NodeJS.Signals | undefined>()

  /**
   * Emitted when the process is about to be disposed.
   */
  public readonly onDispose = this._onDispose.event

  /**
   * Uniquely named logger for the process.
   */
  public abstract logger: Logger

  public constructor() {
    process.on("SIGINT", () => this._onDispose.emit("SIGINT"))
    process.on("SIGTERM", () => this._onDispose.emit("SIGTERM"))
    process.on("exit", () => this._onDispose.emit(undefined))

    this.onDispose((signal, wait) => {
      // Remove listeners to avoid possibly triggering disposal again.
      process.removeAllListeners()

      // Try waiting for other handlers to run first then exit.
      this.logger.debug("disposing", field("code", signal))
      wait.then(() => this.exit(0))
      setTimeout(() => this.exit(0), 5000)
    })
  }

  /**
   * Ensure control over when the process exits.
   */
  public preventExit(): void {
    ;(process.exit as any) = (code?: number) => {
      this.logger.warn(`process.exit() was prevented: ${code || "unknown code"}.`)
    }
  }

  private readonly processExit: (code?: number) => never = process.exit

  /**
   * Will always exit even if normal exit is being prevented.
   */
  public exit(error?: number | ProcessError): never {
    if (error && typeof error !== "number") {
      this.processExit(typeof error.code === "number" ? error.code : 1)
    } else {
      this.processExit(error)
    }
  }
}

/**
 * Child process that will clean up after itself if the parent goes away and can
 * perform a handshake with the parent and ask it to relaunch.
 */
class ChildProcess extends Process {
  public logger = logger.named(`child:${process.pid}`)

  public constructor(private readonly parentPid: number) {
    super()

    // Kill the inner process if the parent dies. This is for the case where the
    // parent process is forcefully terminated and cannot clean up.
    setInterval(() => {
      try {
        // process.kill throws an exception if the process doesn't exist.
        process.kill(this.parentPid, 0)
      } catch (_) {
        // Consider this an error since it should have been able to clean up
        // the child process unless it was forcefully killed.
        this.logger.error(`parent process ${parentPid} died`)
        this._onDispose.emit(undefined)
      }
    }, 5000)
  }

  /**
   * Initiate the handshake and wait for a response from the parent.
   */
  public handshake(): Promise<void> {
    return new Promise((resolve) => {
      const onMessage = (message: Message): void => {
        logger.debug(`received message from ${this.parentPid}`, field("message", message))
        if (message.type === "handshake") {
          process.removeListener("message", onMessage)
          resolve()
        }
      }
      // Initiate the handshake and wait for the reply.
      process.on("message", onMessage)
      this.send({ type: "handshake" })
    })
  }

  /**
   * Notify the parent process that it should relaunch the child.
   */
  public relaunch(version: string): void {
    this.send({ type: "relaunch", version })
  }

  /**
   * Send a message to the parent.
   */
  private send(message: Message): void {
    if (!process.send) {
      throw new Error("not spawned with IPC")
    }
    process.send(message)
  }
}

export interface WrapperOptions {
  maxMemory?: number
  nodeOptions?: string
}

/**
 * Parent process wrapper that spawns the child process and performs a handshake
 * with it. Will relaunch the child if it receives a SIGUSR1 or is asked to by
 * the child. If the child otherwise exits the parent will also exit.
 */
export class ParentProcess extends Process {
  public logger = logger.named(`parent:${process.pid}`)

  private child?: cp.ChildProcess
  private started?: Promise<void>
  private readonly logStdoutStream: rfs.RotatingFileStream
  private readonly logStderrStream: rfs.RotatingFileStream

  protected readonly _onChildMessage = new Emitter<Message>()
  protected readonly onChildMessage = this._onChildMessage.event

  public constructor(private currentVersion: string, private readonly options?: WrapperOptions) {
    super()

    const opts = {
      size: "10M",
      maxFiles: 10,
    }
    this.logStdoutStream = rfs.createStream(path.join(paths.data, "coder-logs", "code-server-stdout.log"), opts)
    this.logStderrStream = rfs.createStream(path.join(paths.data, "coder-logs", "code-server-stderr.log"), opts)

    this.onDispose(() => {
      this.disposeChild()
    })

    this.onChildMessage((message) => {
      switch (message.type) {
        case "relaunch":
          this.logger.info(`Relaunching: ${this.currentVersion} -> ${message.version}`)
          this.currentVersion = message.version
          this.relaunch()
          break
        default:
          this.logger.error(`Unrecognized message ${message}`)
          break
      }
    })
  }

  private disposeChild(): void {
    this.started = undefined
    if (this.child) {
      this.child.removeAllListeners()
      this.child.kill()
    }
  }

  private async relaunch(): Promise<void> {
    this.disposeChild()
    try {
      await this.start()
    } catch (error) {
      this.logger.error(error.message)
      this.exit(typeof error.code === "number" ? error.code : 1)
    }
  }

  public start(): Promise<void> {
    // If we have a process then we've already bound this.
    if (!this.child) {
      process.on("SIGUSR1", async () => {
        this.logger.info("Received SIGUSR1; hotswapping")
        this.relaunch()
      })
    }
    if (!this.started) {
      this.started = this._start()
    }
    return this.started
  }

  private async _start(): Promise<void> {
    const child = this.spawn()
    this.child = child

    // Log both to stdout and to the log directory.
    if (child.stdout) {
      child.stdout.pipe(this.logStdoutStream)
      child.stdout.pipe(process.stdout)
    }
    if (child.stderr) {
      child.stderr.pipe(this.logStderrStream)
      child.stderr.pipe(process.stderr)
    }

    this.logger.debug(`spawned inner process ${child.pid}`)

    await this.handshake(child)

    child.once("exit", (code) => {
      this.logger.debug(`inner process ${child.pid} exited unexpectedly`)
      this.exit(code || 0)
    })
  }

  private spawn(): cp.ChildProcess {
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

  /**
   * Wait for a handshake from the child then reply.
   */
  private handshake(child: cp.ChildProcess): Promise<void> {
    return new Promise((resolve, reject) => {
      const onMessage = (message: Message): void => {
        logger.debug(`received message from ${child.pid}`, field("message", message))
        if (message.type === "handshake") {
          child.removeListener("message", onMessage)
          child.on("message", (msg) => this._onChildMessage.emit(msg))
          child.send({ type: "handshake" })
          resolve()
        }
      }
      child.on("message", onMessage)
      child.once("error", reject)
      child.once("exit", (code) => {
        reject(new ProcessError(`Unexpected exit with code ${code}`, code !== null ? code : undefined))
      })
    })
  }
}

/**
 * Process wrapper.
 */
export const wrapper =
  typeof process.env.CODE_SERVER_PARENT_PID !== "undefined"
    ? new ChildProcess(parseInt(process.env.CODE_SERVER_PARENT_PID))
    : new ParentProcess(require("../../package.json").version)

export function isChild(proc: ChildProcess | ParentProcess): proc is ChildProcess {
  return proc instanceof ChildProcess
}

// It's possible that the pipe has closed (for example if you run code-server
// --version | head -1). Assume that means we're done.
if (!process.stdout.isTTY) {
  process.stdout.on("error", () => wrapper.exit())
}

// Don't let uncaught exceptions crash the process.
process.on("uncaughtException", (error) => {
  wrapper.logger.error(`Uncaught exception: ${error.message}`)
  if (typeof error.stack !== "undefined") {
    wrapper.logger.error(error.stack)
  }
})
