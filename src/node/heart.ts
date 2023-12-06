import { logger } from "@coder/logger"
import { promises as fs } from "fs"

/**
 * Provides a heartbeat using a local file to indicate activity.
 */
export class Heart {
  private heartbeatTimer?: NodeJS.Timeout
  private heartbeatInterval = 60000
  public lastHeartbeat = 0

  public constructor(
    private readonly heartbeatPath: string,
    private readonly isActive: () => Promise<boolean>,
  ) {
    this.beat = this.beat.bind(this)
    this.alive = this.alive.bind(this)
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
    this.heartbeatTimer = setTimeout(() => heartbeatTimer(this.isActive, this.beat), this.heartbeatInterval)
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
