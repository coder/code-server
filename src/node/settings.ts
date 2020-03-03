import * as fs from "fs-extra"
import * as path from "path"
import { extend, xdgLocalDir } from "./util"
import { logger } from "@coder/logger"

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
      await fs.writeFile(this.settingsPath, JSON.stringify(extend(await this.read(), settings), null, 2))
    } catch (error) {
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
  lastVisited: {
    url: string
    workspace: boolean
  }
}

/**
 * Global code-server settings file.
 */
export const settings = new SettingsProvider<CoderSettings>(path.join(xdgLocalDir, "coder.json"))
