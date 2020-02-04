import * as fs from "fs-extra"
import { logger } from "@coder/logger"
import { extend } from "./util"

export type Settings = { [key: string]: Settings | string | boolean | number }

/**
 * Provides read and write access to settings.
 */
export class SettingsProvider<T> {
  public constructor(private readonly settingsPath: string) {}

  /**
   * Read settings from the file. On a failure return last known settings and
   * log a warning.
   */
  public async read(): Promise<T> {
    try {
      const raw = (await fs.readFile(this.settingsPath, "utf8")).trim()
      return raw ? JSON.parse(raw) : {}
    } catch (error) {
      if (error.code !== "ENOENT") {
        logger.warn(error.message)
      }
    }
    return {} as T
  }

  /**
   * Write settings combined with current settings. On failure log a warning.
   * Objects will be merged and everything else will be replaced.
   */
  public async write(settings: Partial<T>): Promise<void> {
    try {
      await fs.writeFile(this.settingsPath, JSON.stringify(extend(this.read(), settings)))
    } catch (error) {
      logger.warn(error.message)
    }
  }
}
