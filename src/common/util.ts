import { logger, field } from "@coder/logger"

export interface Options {
  base: string
  commit: string
  logLevel: number
  pid?: number
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
 * Remove extra slashes in a URL.
 */
export const normalize = (url: string, keepTrailing = false): string => {
  return url.replace(/\/\/+/g, "/").replace(/\/+$/, keepTrailing ? "/" : "")
}

/**
 * Get options embedded in the HTML or query params.
 */
export const getOptions = <T extends Options>(): T => {
  let options: T
  try {
    const el = document.getElementById("coder-options")
    if (!el) {
      throw new Error("no options element")
    }
    const value = el.getAttribute("data-settings")
    if (!value) {
      throw new Error("no options value")
    }
    options = JSON.parse(value)
  } catch (error) {
    options = {} as T
  }

  const params = new URLSearchParams(location.search)
  const queryOpts = params.get("options")
  if (queryOpts) {
    options = {
      ...options,
      ...JSON.parse(queryOpts),
    }
  }

  if (typeof options.logLevel !== "undefined") {
    logger.level = options.logLevel
  }
  if (options.base) {
    const parts = location.pathname.replace(/^\//g, "").split("/")
    parts[parts.length - 1] = options.base
    const url = new URL(location.origin + "/" + parts.join("/"))
    options.base = normalize(url.pathname, true)
  }

  logger.debug("got options", field("options", options))

  return options
}
