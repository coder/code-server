/**
 * Appends an 's' to the provided string if count is greater than one;
 * otherwise the string is returned
 */
export const plural = (count: number, str: string): string => (count === 1 ? str : `${str}s`)

export const generateUuid = (length = 24): string => {
  const possible = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
  return Array(length)
    .fill(1)
    .map(() => possible[Math.floor(Math.random() * possible.length)])
    .join("")
}

/**
 * Remove extra slashes in a URL.
 *
 * This is meant to fill the job of `path.join` so you can concatenate paths and
 * then normalize out any extra slashes.
 *
 * If you are using `path.join` you do not need this but note that `path` is for
 * file system paths, not URLs.
 */
export const normalize = (url: string, keepTrailing = false): string => {
  return url.replace(/\/\/+/g, "/").replace(/\/+$/, keepTrailing ? "/" : "")
}

// TODO: Might make sense to add Error handling to the logger itself.
export function logError(logger: { error: (msg: string) => void }, prefix: string, err: unknown): void {
  if (err instanceof Error) {
    logger.error(`${prefix}: ${err.message} ${err.stack}`)
  } else {
    logger.error(`${prefix}: ${err}`)
  }
}
