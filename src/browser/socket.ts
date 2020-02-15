import { field, logger, Logger } from "@coder/logger"
import { Emitter } from "../common/emitter"
import { generateUuid } from "../common/util"

const decoder = new TextDecoder("utf8")
export const decode = (buffer: string | ArrayBuffer): string => {
  return typeof buffer !== "string" ? decoder.decode(buffer) : buffer
}

/**
 * A web socket that reconnects itself when it closes. Sending messages while
 * disconnected will throw an error.
 */
export class ReconnectingSocket {
  protected readonly _onMessage = new Emitter<string | ArrayBuffer>()
  public readonly onMessage = this._onMessage.event
  protected readonly _onDisconnect = new Emitter<number | undefined>()
  public readonly onDisconnect = this._onDisconnect.event
  protected readonly _onClose = new Emitter<number | undefined>()
  public readonly onClose = this._onClose.event
  protected readonly _onConnect = new Emitter<void>()
  public readonly onConnect = this._onConnect.event

  // This helps distinguish messages between sockets.
  private readonly logger: Logger

  private socket?: WebSocket
  private connecting?: Promise<void>
  private closed = false
  private readonly openTimeout = 10000

  // Every time the socket fails to connect, the retry will be increasingly
  // delayed up to a maximum.
  private readonly retryBaseDelay = 1000
  private readonly retryMaxDelay = 10000
  private retryDelay?: number
  private readonly retryDelayFactor = 1.5

  // The socket must be connected for this amount of time before resetting the
  // retry delay. This prevents rapid retries when the socket does connect but
  // is closed shortly after.
  private resetRetryTimeout?: NodeJS.Timeout
  private readonly resetRetryDelay = 10000

  private _binaryType: typeof WebSocket.prototype.binaryType = "arraybuffer"

  public constructor(private customPath?: string, public readonly id: string = generateUuid(4)) {
    // On Firefox the socket seems to somehow persist a page reload so the close
    // event runs and we see "attempting to reconnect".
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => this.close())
    }
    this.logger = logger.named(this.id)
  }

  public set binaryType(b: typeof WebSocket.prototype.binaryType) {
    this._binaryType = b
    if (this.socket) {
      this.socket.binaryType = b
    }
  }

  /**
   * Permanently close the connection. Will not attempt to reconnect. Will
   * remove event listeners.
   */
  public close(code?: number): void {
    if (this.closed) {
      return
    }

    if (code) {
      this.logger.info(`closing with code ${code}`)
    }

    if (this.resetRetryTimeout) {
      clearTimeout(this.resetRetryTimeout)
    }

    this.closed = true

    if (this.socket) {
      this.socket.close()
    } else {
      this._onClose.emit(code)
    }
  }

  public dispose(): void {
    this._onMessage.dispose()
    this._onDisconnect.dispose()
    this._onClose.dispose()
    this._onConnect.dispose()
    this.logger.debug("disposed handlers")
  }

  /**
   * Send a message on the socket. Logs an error if currently disconnected.
   */
  public send(message: string | ArrayBuffer): void {
    this.logger.trace(() => ["sending message", field("message", decode(message))])
    if (!this.socket) {
      return logger.error("tried to send message on closed socket")
    }
    this.socket.send(message)
  }

  /**
   * Connect to the socket. Can also be called to wait until the connection is
   * established in the case of disconnections. Multiple calls will be handled
   * correctly.
   */
  public async connect(): Promise<void> {
    if (!this.connecting) {
      this.connecting = new Promise((resolve, reject) => {
        const tryConnect = (): void => {
          if (this.closed) {
            return reject(new Error("disconnected")) // Don't keep trying if we've closed permanently.
          }
          if (typeof this.retryDelay === "undefined") {
            this.retryDelay = 0
          } else {
            this.retryDelay = this.retryDelay * this.retryDelayFactor || this.retryBaseDelay
            if (this.retryDelay > this.retryMaxDelay) {
              this.retryDelay = this.retryMaxDelay
            }
          }
          this._connect()
            .then((socket) => {
              this.logger.info("connected")
              this.socket = socket
              this.socket.binaryType = this._binaryType
              if (this.resetRetryTimeout) {
                clearTimeout(this.resetRetryTimeout)
              }
              this.resetRetryTimeout = setTimeout(() => (this.retryDelay = undefined), this.resetRetryDelay)
              this.connecting = undefined
              this._onConnect.emit()
              resolve()
            })
            .catch((error) => {
              this.logger.error(`failed to connect: ${error.message}`)
              tryConnect()
            })
        }
        tryConnect()
      })
    }
    return this.connecting
  }

  private async _connect(): Promise<WebSocket> {
    const socket = await new Promise<WebSocket>((resolve, _reject) => {
      if (this.retryDelay) {
        this.logger.info(`retrying in ${this.retryDelay}ms...`)
      }
      setTimeout(() => {
        this.logger.info("connecting...")
        const socket = new WebSocket(
          `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}${this.customPath || location.pathname}${
            location.search ? `?${location.search}` : ""
          }`,
        )

        const reject = (): void => {
          _reject(new Error("socket closed"))
        }

        const timeout = setTimeout(() => {
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          socket.removeEventListener("open", open)
          socket.removeEventListener("close", reject)
          _reject(new Error("timeout"))
        }, this.openTimeout)

        const open = (): void => {
          clearTimeout(timeout)
          socket.removeEventListener("close", reject)
          resolve(socket)
        }

        socket.addEventListener("open", open)
        socket.addEventListener("close", reject)
      }, this.retryDelay)
    })

    socket.addEventListener("message", (event) => {
      this.logger.trace(() => ["got message", field("message", decode(event.data))])
      this._onMessage.emit(event.data)
    })
    socket.addEventListener("close", (event) => {
      this.socket = undefined
      if (!this.closed) {
        this._onDisconnect.emit(event.code)
        // It might be closed in the event handler.
        if (!this.closed) {
          this.logger.info("connection closed; attempting to reconnect")
          this.connect()
        }
      } else {
        this._onClose.emit(event.code)
        this.logger.info("connection closed permanently")
      }
    })

    return socket
  }
}
