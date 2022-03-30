import { logger } from "@coder/logger"
import { Query } from "express-serve-static-core"
import { promises as fs } from "fs"

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
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        logger.warn(error.message)
      }
    }
    return {} as T
  }

  /**
   * Write settings combined with current settings. On failure log a warning.
   * Settings will be merged shallowly.
   */
  public async write(settings: Partial<T>): Promise<void> {
    try {
      const oldSettings = await this.read()
      const nextSettings = { ...oldSettings, ...settings }
      await fs.writeFile(this.settingsPath, JSON.stringify(nextSettings, null, 2))
    } catch (error: any) {
      logger.warn(error.message)
    }
  }
}

export interface UpdateSettings {
  update: {
    checked: number
    version: string
  }
}

/**
 * Global code-server settings.
 */
export interface CoderSettings extends UpdateSettings {
  query?: Query
}
