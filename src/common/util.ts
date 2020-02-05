import { logger } from "@coder/logger"
import { Application } from "../common/api"

export interface Options {
  app?: Application
  authed: boolean
  basePath: string
  logLevel: number
}

/**
 * Split a string up to the delimiter. If the delimiter doesn't exist the first
 * item will have all the text and the second item will be an empty string.
 */
export const split = (str: string, delimiter: string): [string, string] => {
  const index = str.indexOf(delimiter)
  return index !== -1 ? [str.substring(0, index).trim(), str.substring(index + 1)] : [str, ""]
}

export const plural = (count: number): string => (count === 1 ? "" : "s")

export const generateUuid = (length = 24): string => {
  const possible = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
  return Array(length)
    .fill(1)
    .map(() => possible[Math.floor(Math.random() * possible.length)])
    .join("")
}

/**
 * Get options embedded in the HTML from the server.
 */
export const getOptions = <T extends Options>(): T => {
  if (typeof document === "undefined") {
    return {} as T
  }
  const el = document.getElementById("coder-options")
  try {
    if (!el) {
      throw new Error("no options element")
    }
    const value = el.getAttribute("data-settings")
    if (!value) {
      throw new Error("no options value")
    }
    const options = JSON.parse(value)
    if (typeof options.logLevel !== "undefined") {
      logger.level = options.logLevel
    }
    return options
  } catch (error) {
    logger.warn(error.message)
    return {} as T
  }
}

/**
 * Remove extra slashes in a URL.
 */
export const normalize = (url: string, keepTrailing = false): string => {
  return url.replace(/\/\/+/g, "/").replace(/\/+$/, keepTrailing ? "/" : "")
}
