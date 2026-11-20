import { logger } from "@coder/logger"
import { promises as fs } from "fs"
import { Emitter } from "../common/emitter"

/**
 * Provides a heartbeat using a local file to indicate activity.
 */
export class Heart {
  private heartbeatTimer?: NodeJS.Timeout
  private heartbeatInterval = 60000
  public lastHeartbeat = 0
  private readonly _onChange = new Emitter<"alive" | "expired" | "unknown">()
  readonly onChange = this._onChange.event
  private state: "alive" | "expired" | "unknown" = "expired"

  public constructor(
    private readonly heartbeatPath: string,
    private readonly isActive: () => Promise<boolean>,
  ) {
    this.beat = this.beat.bind(this)
    this.alive = this.alive.bind(this)
  }

  private setState(state: typeof this.state) {
    if (this.state !== state) {
      this.state = state
      this._onChange.emit(this.state)
    }
  }

  public alive(): boolean {
    const now = Date.now()
    return now - this.lastHeartbeat < this.heartbeatInterval
  }
  /**
   * Write to the heartbeat file if we haven't already done so within the
   * timeout and start or reset a timer that keeps running as long as there is
   * activity. Failures are logged as warnings.
   */
  public async beat(): Promise<void> {
    if (this.alive()) {
      this.setState("alive")
      return
    }

    return this.pulse()
  }

  /**
   * Write to the heartbeat file and schedule the next activity check.
   *
   * The timer calls this instead of `beat` because timers and `Date.now()` use
   * different clocks, so the timer can fire when `Date.now()` shows slightly
   * less than a full interval since the last beat.  `alive` would still be true
   * then and `beat` would return without scheduling another check, which stops
   * the heartbeat until the next HTTP request.
   */
  private async pulse(): Promise<void> {
    logger.debug("heartbeat")
    this.lastHeartbeat = Date.now()
    if (typeof this.heartbeatTimer !== "undefined") {
      clearTimeout(this.heartbeatTimer)
    }

    this.heartbeatTimer = setTimeout(async () => {
      try {
        if (await this.isActive()) {
          this.pulse()
        } else {
          this.setState("expired")
        }
      } catch (error: unknown) {
        logger.warn((error as Error).message)
        this.setState("unknown")
      }
    }, this.heartbeatInterval)

    this.setState("alive")

    try {
      return await fs.writeFile(this.heartbeatPath, "")
    } catch (error: any) {
      logger.warn(error.message)
    }
  }

  /**
   * Call to clear any heartbeatTimer for shutdown.
   */
  public dispose(): void {
    if (typeof this.heartbeatTimer !== "undefined") {
      clearTimeout(this.heartbeatTimer)
    }
  }
}
