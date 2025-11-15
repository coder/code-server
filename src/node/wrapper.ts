import { field, Logger, logger } from "@coder/logger"
import * as cp from "child_process"
import * as path from "path"
import * as rfs from "rotating-file-stream"
import { Emitter } from "../common/emitter"
import { DefaultedArgs, redactArgs } from "./cli"
import { paths } from "./util"

const timeoutInterval = 10000 // 10s, matches VS Code's timeouts.

/**
 * Listen to a single message from a process. Reject if the process errors,
 * exits, or times out.
 *
 * `fn` is a function that determines whether the message is the one we're
 * waiting for.
 */
export function onMessage<M, T extends M>(
  proc: cp.ChildProcess | NodeJS.Process,
  fn: (message: M) => message is T,
  customLogger?: Logger,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      proc.off("error", onError)
      proc.off("exit", onExit)
      proc.off("message", onMessage)
      clearTimeout(timeout)
    }

    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error("timed out"))
    }, timeoutInterval)

    const onError = (error: Error) => {
      cleanup()
      reject(error)
    }

    const onExit = (code: number) => {
      cleanup()
      reject(new Error(`exited unexpectedly with code ${code}`))
    }

    const onMessage = (message: M) => {
      if (fn(message)) {
        cleanup()
        resolve(message)
      } else {
        ;(customLogger || logger).debug("got unhandled message", field("message", message))
      }
    }

    proc.on("message", onMessage)
    // NodeJS.Process doesn't have `error` but binding anyway shouldn't break
    // anything. It does have `exit` but the types aren't working.
    ;(proc as cp.ChildProcess).on("error", onError)
    ;(proc as cp.ChildProcess).on("exit", onExit)
  })
}

interface ParentHandshakeMessage {
  type: "handshake"
  args: DefaultedArgs
}

interface ChildHandshakeMessage {
  type: "handshake"
}

interface RelaunchMessage {
  type: "relaunch"
  version: string
}

type ChildMessage = RelaunchMessage | ChildHandshakeMessage
type ParentMessage = ParentHandshakeMessage

class ProcessError extends Error {
  public constructor(
    message: string,
    public readonly code: number | undefined,
  ) {
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
export class ChildProcess extends Process {
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
  public async handshake(): Promise<DefaultedArgs> {
    this.logger.debug("initiating handshake")
    this.send({ type: "handshake" })
    const message = await onMessage<ParentMessage, ParentHandshakeMessage>(
      process,
      (message): message is ParentHandshakeMessage => {
        return message.type === "handshake"
      },
      this.logger,
    )
    this.logger.debug(
      "got message",
      field("message", {
        type: message.type,
        args: redactArgs(message.args),
      }),
    )
    return message.args
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
  private send(message: ChildMessage): void {
    if (!process.send) {
      throw new Error("not spawned with IPC")
    }
    process.send(message)
  }
}

/**
 * Parent process wrapper that spawns the child process and performs a handshake
 * with it. Will relaunch the child if it receives a SIGUSR1 or SIGUSR2 or is
 * asked to by the child. If the child otherwise exits the parent will also
 * exit.
 */
export class ParentProcess extends Process {
  public logger = logger.named(`parent:${process.pid}`)

  private child?: cp.ChildProcess
  private started?: Promise<void>
  private readonly logStdoutStream: rfs.RotatingFileStream
  private readonly logStderrStream: rfs.RotatingFileStream

  protected readonly _onChildMessage = new Emitter<ChildMessage>()
  protected readonly onChildMessage = this._onChildMessage.event

  private args?: DefaultedArgs

  public constructor(private currentVersion: string) {
    super()

    process.on("SIGUSR1", async () => {
      this.logger.info("Received SIGUSR1; hotswapping")
      this.relaunch()
    })

    process.on("SIGUSR2", async () => {
      this.logger.info("Received SIGUSR2; hotswapping")
      this.relaunch()
    })

    const opts = {
      size: "10M",
      maxFiles: 10,
      path: path.join(paths.data, "coder-logs"),
    }
    this.logStdoutStream = rfs.createStream("code-server-stdout.log", opts)
    this.logStderrStream = rfs.createStream("code-server-stderr.log", opts)

    this.onDispose(() => this.disposeChild())

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

  private async disposeChild(): Promise<void> {
    this.started = undefined
    if (this.child) {
      const child = this.child
      child.removeAllListeners()
      child.kill()
      // Wait for the child to exit otherwise its output will be lost which can
      // be especially problematic if you're trying to debug why cleanup failed.
      await new Promise((r) => child!.on("exit", r))
    }
  }

  private async relaunch(): Promise<void> {
    this.disposeChild()
    try {
      this.started = this._start()
      await this.started
    } catch (error: any) {
      this.logger.error(error.message)
      this.exit(typeof error.code === "number" ? error.code : 1)
    }
  }

  public start(args: DefaultedArgs): Promise<void> {
    // Our logger was created before we parsed CLI arguments so update the level
    // in case it has changed.
    this.logger.level = logger.level

    // Store for relaunches.
    this.args = args
    if (!this.started) {
      this.started = this._start()
    }
    return this.started
  }

  private async _start(): Promise<void> {
    const child = this.spawn()
    this.child = child

    // Log child output to stdout/stderr and to the log directory.
    if (child.stdout) {
      child.stdout.on("data", (data) => {
        this.logStdoutStream.write(data)
        process.stdout.write(data)
      })
    }
    if (child.stderr) {
      child.stderr.on("data", (data) => {
        this.logStderrStream.write(data)
        process.stderr.write(data)
      })
    }

    this.logger.debug(`spawned child process ${child.pid}`)

    await this.handshake(child)

    child.once("exit", (code) => {
      this.logger.debug(`inner process ${child.pid} exited unexpectedly`)
      this.exit(code || 0)
    })
  }

  private spawn(): cp.ChildProcess {
    return cp.fork(path.join(__dirname, "entry"), {
      env: {
        ...process.env,
        CODE_SERVER_PARENT_PID: process.pid.toString(),
        NODE_EXEC_PATH: process.execPath,
      },
      stdio: ["pipe", "pipe", "pipe", "ipc"],
    })
  }

  /**
   * Wait for a handshake from the child then reply.
   */
  private async handshake(child: cp.ChildProcess): Promise<void> {
    if (!this.args) {
      throw new Error("started without args")
    }
    const message = await onMessage<ChildMessage, ChildHandshakeMessage>(
      child,
      (message): message is ChildHandshakeMessage => {
        return message.type === "handshake"
      },
      this.logger,
    )
    this.logger.debug("got message", field("message", message))
    this.send(child, { type: "handshake", args: this.args })
  }

  /**
   * Send a message to the child.
   */
  private send(child: cp.ChildProcess, message: ParentMessage): void {
    child.send(message)
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
