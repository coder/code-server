import { logger } from "@coder/logger"
import { promises as fs } from "fs"

/**
 * Provides a heartbeat using a local file to indicate activity.
 */
export class Heart {
  private heartbeatTimer?: NodeJS.Timeout
  private heartbeatInterval = 60000
  public lastHeartbeat = 0

  public constructor(private readonly heartbeatPath: string, private readonly isActive: () => Promise<boolean>) {}

  public alive(): boolean {
    const now = Date.now()
    return now - this.lastHeartbeat < this.heartbeatInterval
  }
  /**
   * Write to the heartbeat file if we haven't already done so within the
   * timeout and start or reset a timer that keeps running as long as there is
   * activity. Failures are logged as warnings.
   */
  public beat(): void {
    if (!this.alive()) {
      logger.trace("heartbeat")
      fs.writeFile(this.heartbeatPath, "").catch((error) => {
        logger.warn(error.message)
      })
      this.lastHeartbeat = Date.now()
      if (typeof this.heartbeatTimer !== "undefined") {
        clearTimeout(this.heartbeatTimer)
      }
      this.heartbeatTimer = setTimeout(() => {
        this.isActive()
          .then((active) => {
            if (active) {
              this.beat()
            }
          })
          .catch((error) => {
            logger.warn(error.message)
          })
      }, this.heartbeatInterval)
    }
  }
}
