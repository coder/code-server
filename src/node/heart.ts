import { logger } from "@coder/logger"
import { promises as fs } from "fs"
import { wrapper } from "./wrapper"

/**
 * Provides a heartbeat using a local file to indicate activity.
 */
export class Heart {
  private heartbeatTimer?: NodeJS.Timeout
  private idleShutdownTimer?: NodeJS.Timeout
  private heartbeatInterval = 60000
  public lastHeartbeat = 0

  public constructor(
    private readonly heartbeatPath: string,
    private idleTimeoutSeconds: number | undefined,
    private readonly isActive: () => Promise<boolean>,
  ) {
    this.beat = this.beat.bind(this)
    this.alive = this.alive.bind(this)

    if (this.idleTimeoutSeconds) {
      this.idleShutdownTimer = setTimeout(() => this.exitIfIdle(), this.idleTimeoutSeconds * 1000)
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
      return
    }

    logger.debug("heartbeat")
    this.lastHeartbeat = Date.now()
    if (typeof this.heartbeatTimer !== "undefined") {
      clearTimeout(this.heartbeatTimer)
    }
    if (typeof this.idleShutdownTimer !== "undefined") {
      clearInterval(this.idleShutdownTimer)
    }
    this.heartbeatTimer = setTimeout(() => heartbeatTimer(this.isActive, this.beat), this.heartbeatInterval)
    if (this.idleTimeoutSeconds) {
      this.idleShutdownTimer = setTimeout(() => this.exitIfIdle(), this.idleTimeoutSeconds * 1000)
    }
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

  private exitIfIdle(): void {
    logger.warn(`Idle timeout of ${this.idleTimeoutSeconds} seconds exceeded`)
    wrapper.exit(0)
  }
}

/**
 * Helper function for the heartbeatTimer.
 *
 * If heartbeat is active, call beat. Otherwise do nothing.
 *
 * Extracted to make it easier to test.
 */
export async function heartbeatTimer(isActive: Heart["isActive"], beat: Heart["beat"]) {
  try {
    if (await isActive()) {
      beat()
    }
  } catch (error: unknown) {
    logger.warn((error as Error).message)
  }
}
