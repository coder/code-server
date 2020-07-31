import * as fs from "fs-extra"
import * as path from "path"
import { extend, paths } from "./util"
import { logger } from "@coder/logger"
import { Route } from "./http"

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
   * Settings can be shallow or deep merged.
   */
  public async write(settings: Partial<T>, shallow = true): Promise<void> {
    try {
      const oldSettings = await this.read()
      const nextSettings = shallow ? Object.assign({}, oldSettings, settings) : extend(oldSettings, settings)
      await fs.writeFile(this.settingsPath, JSON.stringify(nextSettings, null, 2))
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
  query: Route["query"]
}

/**
 * Global code-server settings file.
 */
export const settings = new SettingsProvider<CoderSettings>(path.join(paths.data, "coder.json"))
