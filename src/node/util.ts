import * as argon2 from "argon2"
import * as cp from "child_process"
import * as crypto from "crypto"
import envPaths from "env-paths"
import { promises as fs } from "fs"
import * as net from "net"
import * as os from "os"
import * as path from "path"
import safeCompare from "safe-compare"
import * as util from "util"
import xdgBasedir from "xdg-basedir"

export interface Paths {
  data: string
  config: string
  runtime: string
}

// From https://github.com/chalk/ansi-regex
const pattern = [
  "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
  "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))",
].join("|")
const re = new RegExp(pattern, "g")

export type OnLineCallback = (strippedLine: string, originalLine: string) => void
/**
 * Split stdout on newlines and strip ANSI codes.
 */
export const onLine = (proc: cp.ChildProcess, callback: OnLineCallback): void => {
  let buffer = ""
  if (!proc.stdout) {
    throw new Error("no stdout")
  }
  proc.stdout.setEncoding("utf8")
  proc.stdout.on("data", (d) => {
    const data = buffer + d
    const split = data.split("\n")
    const last = split.length - 1

    for (let i = 0; i < last; ++i) {
      callback(split[i].replace(re, ""), split[i])
    }

    // The last item will either be an empty string (the data ended with a
    // newline) or a partial line (did not end with a newline) and we must
    // wait to parse it until we get a full line.
    buffer = split[last]
  })
}

export const paths = getEnvPaths()

/**
 * Gets the config and data paths for the current platform/configuration.
 * On MacOS this function gets the standard XDG directories instead of using the native macOS
 * ones. Most CLIs do this as in practice only GUI apps use the standard macOS directories.
 */
export function getEnvPaths(platform = process.platform): Paths {
  const paths = envPaths("code-server", { suffix: "" })
  const append = (p: string): string => path.join(p, "code-server")
  switch (platform) {
    case "darwin":
      return {
        // envPaths uses native directories so force Darwin to use the XDG spec
        // to align with other CLI tools.
        data: xdgBasedir.data ? append(xdgBasedir.data) : paths.data,
        config: xdgBasedir.config ? append(xdgBasedir.config) : paths.config,
        // Fall back to temp if there is no runtime dir.
        runtime: xdgBasedir.runtime ? append(xdgBasedir.runtime) : paths.temp,
      }
    case "win32":
      return {
        data: paths.data,
        config: paths.config,
        // Windows doesn't have a runtime dir.
        runtime: paths.temp,
      }
    default:
      return {
        data: paths.data,
        config: paths.config,
        // Fall back to temp if there is no runtime dir.
        runtime: xdgBasedir.runtime ? append(xdgBasedir.runtime) : paths.temp,
      }
  }
}

export const generateCertificate = async (hostname: string): Promise<{ cert: string; certKey: string }> => {
  const certPath = path.join(paths.data, `${hostname.replace(/\./g, "_")}.crt`)
  const certKeyPath = path.join(paths.data, `${hostname.replace(/\./g, "_")}.key`)

  // Try generating the certificates if we can't access them (which probably
  // means they don't exist).
  try {
    await Promise.all([fs.access(certPath), fs.access(certKeyPath)])
  } catch (error) {
    // Require on demand so openssl isn't required if you aren't going to
    // generate certificates.
    const pem = require("pem") as typeof import("pem")
    const certs = await new Promise<import("pem").CertificateCreationResult>((resolve, reject): void => {
      pem.createCertificate(
        {
          selfSigned: true,
          commonName: hostname,
          config: `
[req]
req_extensions = v3_req

[ v3_req ]
basicConstraints = CA:true
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = ${hostname}
`,
        },
        (error, result) => {
          return error ? reject(error) : resolve(result)
        },
      )
    })
    await fs.mkdir(paths.data, { recursive: true })
    await Promise.all([fs.writeFile(certPath, certs.certificate), fs.writeFile(certKeyPath, certs.serviceKey)])
  }

  return {
    cert: certPath,
    certKey: certKeyPath,
  }
}

export const generatePassword = async (length = 24): Promise<string> => {
  const buffer = Buffer.alloc(Math.ceil(length / 2))
  await util.promisify(crypto.randomFill)(buffer)
  return buffer.toString("hex").substring(0, length)
}

/**
 * Used to hash the password.
 */
export const hash = async (password: string): Promise<string> => {
  return await argon2.hash(password)
}

/**
 * Used to verify if the password matches the hash
 */
export const isHashMatch = async (password: string, hash: string) => {
  if (password === "" || hash === "" || !hash.startsWith("$")) {
    return false
  }
  return await argon2.verify(hash, password)
}

/**
 * Used to hash the password using the sha256
 * algorithm. We only use this to for checking
 * the hashed-password set in the config.
 *
 * Kept for legacy reasons.
 */
export const hashLegacy = (str: string): string => {
  return crypto.createHash("sha256").update(str).digest("hex")
}

/**
 * Used to check if the password matches the hash using
 * the hashLegacy function
 */
export const isHashLegacyMatch = (password: string, hashPassword: string) => {
  const hashedWithLegacy = hashLegacy(password)
  return safeCompare(hashedWithLegacy, hashPassword)
}

export type PasswordMethod = "SHA256" | "ARGON2" | "PLAIN_TEXT"

/**
 * Used to determine the password method.
 *
 * There are three options for the return value:
 * 1. "SHA256" -> the legacy hashing algorithm
 * 2. "ARGON2" -> the newest hashing algorithm
 * 3. "PLAIN_TEXT" -> regular ol' password with no hashing
 *
 * @returns {PasswordMethod} "SHA256" | "ARGON2" | "PLAIN_TEXT"
 */
export function getPasswordMethod(hashedPassword: string | undefined): PasswordMethod {
  if (!hashedPassword) {
    return "PLAIN_TEXT"
  }

  // This is the new hashing algorithm
  if (hashedPassword.includes("$argon")) {
    return "ARGON2"
  }

  // This is the legacy hashing algorithm
  return "SHA256"
}

type PasswordValidation = {
  isPasswordValid: boolean
  hashedPassword: string
}

type HandlePasswordValidationArgs = {
  /** The PasswordMethod */
  passwordMethod: PasswordMethod
  /** The password provided by the user */
  passwordFromRequestBody: string
  /** The password set in PASSWORD or config */
  passwordFromArgs: string | undefined
  /** The hashed-password set in HASHED_PASSWORD or config */
  hashedPasswordFromArgs: string | undefined
}

/**
 * Checks if a password is valid and also returns the hash
 * using the PasswordMethod
 */
export async function handlePasswordValidation({
  passwordMethod,
  passwordFromArgs,
  passwordFromRequestBody,
  hashedPasswordFromArgs,
}: HandlePasswordValidationArgs): Promise<PasswordValidation> {
  const passwordValidation = <PasswordValidation>{
    isPasswordValid: false,
    hashedPassword: "",
  }

  switch (passwordMethod) {
    case "PLAIN_TEXT": {
      const isValid = passwordFromArgs ? safeCompare(passwordFromRequestBody, passwordFromArgs) : false
      passwordValidation.isPasswordValid = isValid

      const hashedPassword = await hash(passwordFromRequestBody)
      passwordValidation.hashedPassword = hashedPassword
      break
    }
    case "SHA256": {
      const isValid = isHashLegacyMatch(passwordFromRequestBody, hashedPasswordFromArgs || "")
      passwordValidation.isPasswordValid = isValid

      passwordValidation.hashedPassword = hashedPasswordFromArgs || (await hashLegacy(passwordFromRequestBody))
      break
    }
    case "ARGON2": {
      const isValid = await isHashMatch(passwordFromRequestBody, hashedPasswordFromArgs || "")
      passwordValidation.isPasswordValid = isValid

      passwordValidation.hashedPassword = hashedPasswordFromArgs || ""
      break
    }
    default:
      break
  }

  return passwordValidation
}

export type IsCookieValidArgs = {
  passwordMethod: PasswordMethod
  cookieKey: string
  hashedPasswordFromArgs: string | undefined
  passwordFromArgs: string | undefined
}

/** Checks if a req.cookies.key is valid using the PasswordMethod */
export async function isCookieValid({
  passwordFromArgs = "",
  cookieKey,
  hashedPasswordFromArgs = "",
  passwordMethod,
}: IsCookieValidArgs): Promise<boolean> {
  let isValid = false
  switch (passwordMethod) {
    case "PLAIN_TEXT":
      isValid = await isHashMatch(passwordFromArgs, cookieKey)
      break
    case "ARGON2":
    case "SHA256":
      isValid = safeCompare(cookieKey, hashedPasswordFromArgs)
      break
    default:
      break
  }
  return isValid
}

/** Ensures that the input is sanitized by checking
 * - it's a string
 * - greater than 0 characters
 * - trims whitespace
 */
export function sanitizeString(str: unknown): string {
  // Very basic sanitization of string
  // Credit: https://stackoverflow.com/a/46719000/3015595
  return typeof str === "string" ? str.trim() : ""
}

const mimeTypes: { [key: string]: string } = {
  ".aac": "audio/x-aac",
  ".avi": "video/x-msvideo",
  ".bmp": "image/bmp",
  ".css": "text/css",
  ".flv": "video/x-flv",
  ".gif": "image/gif",
  ".html": "text/html",
  ".ico": "image/x-icon",
  ".jpe": "image/jpg",
  ".jpeg": "image/jpg",
  ".jpg": "image/jpg",
  ".js": "application/javascript",
  ".json": "application/json",
  ".m1v": "video/mpeg",
  ".m2a": "audio/mpeg",
  ".m2v": "video/mpeg",
  ".m3a": "audio/mpeg",
  ".mid": "audio/midi",
  ".midi": "audio/midi",
  ".mk3d": "video/x-matroska",
  ".mks": "video/x-matroska",
  ".mkv": "video/x-matroska",
  ".mov": "video/quicktime",
  ".movie": "video/x-sgi-movie",
  ".mp2": "audio/mpeg",
  ".mp2a": "audio/mpeg",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".mp4a": "audio/mp4",
  ".mp4v": "video/mp4",
  ".mpe": "video/mpeg",
  ".mpeg": "video/mpeg",
  ".mpg": "video/mpeg",
  ".mpg4": "video/mp4",
  ".mpga": "audio/mpeg",
  ".oga": "audio/ogg",
  ".ogg": "audio/ogg",
  ".ogv": "video/ogg",
  ".png": "image/png",
  ".psd": "image/vnd.adobe.photoshop",
  ".qt": "video/quicktime",
  ".spx": "audio/ogg",
  ".svg": "image/svg+xml",
  ".tga": "image/x-tga",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".txt": "text/plain",
  ".wav": "audio/x-wav",
  ".wasm": "application/wasm",
  ".webm": "video/webm",
  ".webp": "image/webp",
  ".wma": "audio/x-ms-wma",
  ".wmv": "video/x-ms-wmv",
  ".woff": "application/font-woff",
}

export const getMediaMime = (filePath?: string): string => {
  return (filePath && mimeTypes[path.extname(filePath)]) || "text/plain"
}

/**
 * A helper function that checks if the platform is Windows Subsystem for Linux
 * (WSL)
 *
 * @see https://github.com/sindresorhus/is-wsl/blob/main/index.js
 * @returns {Boolean} boolean if it is WSL
 */
export const isWsl = async (
  platform: NodeJS.Platform,
  osRelease: string,
  procVersionFilePath: string,
): Promise<boolean> => {
  if (platform !== "linux") {
    return false
  }

  if (osRelease.toLowerCase().includes("microsoft")) {
    return true
  }

  try {
    return (await fs.readFile(procVersionFilePath, "utf8")).toLowerCase().includes("microsoft")
  } catch (_) {
    return false
  }
}

interface OpenOptions {
  args: string[]
  command: string
  urlSearch: string
}

/**
 * A helper function to construct options for `open` function.
 *
 * Extract to make it easier to test.
 *
 * @param platform - platform on machine
 * @param urlSearch - url.search
 * @returns  an object with args, command, options and urlSearch
 */
export function constructOpenOptions(platform: NodeJS.Platform | "wsl", urlSearch: string): OpenOptions {
  const args: string[] = []
  let command = platform === "darwin" ? "open" : "xdg-open"
  if (platform === "win32" || platform === "wsl") {
    command = platform === "wsl" ? "cmd.exe" : "cmd"
    args.push("/c", "start", '""', "/b")
    urlSearch = urlSearch.replace(/&/g, "^&")
  }

  return {
    args,
    command,
    urlSearch,
  }
}

/**
 * Try opening an address using whatever the system has set for opening URLs.
 */
export const open = async (address: URL | string): Promise<void> => {
  if (typeof address === "string") {
    throw new Error("Cannot open socket paths")
  }
  // Web sockets do not seem to work if browsing with 0.0.0.0.
  const url = new URL(address)
  if (url.hostname === "0.0.0.0") {
    url.hostname = "localhost"
  }
  const platform = (await isWsl(process.platform, os.release(), "/proc/version")) ? "wsl" : process.platform
  const { command, args, urlSearch } = constructOpenOptions(platform, url.search)
  url.search = urlSearch
  const proc = cp.spawn(command, [...args, url.toString()], {})
  await new Promise<void>((resolve, reject) => {
    proc.on("error", reject)
    proc.on("close", (code) => {
      return code !== 0 ? reject(new Error(`Failed to open with code ${code}`)) : resolve()
    })
  })
}

/**
 * Return a promise that resolves with whether the socket path is active.
 */
export function canConnect(path: string): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect(path)
    socket.once("error", () => resolve(false))
    socket.once("connect", () => {
      socket.destroy()
      resolve(true)
    })
  })
}

export const isFile = async (path: string): Promise<boolean> => {
  try {
    const stat = await fs.stat(path)
    return stat.isFile()
  } catch (error) {
    return false
  }
}

export const isDirectory = async (path: string): Promise<boolean> => {
  try {
    const stat = await fs.stat(path)
    return stat.isDirectory()
  } catch (error) {
    return false
  }
}

/**
 * Escapes any HTML string special characters, like &, <, >, ", and '.
 *
 * Source: https://stackoverflow.com/a/6234804/3015595
 **/
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

/**
 * A helper function which returns a boolean indicating whether
 * the given error is a NodeJS.ErrnoException by checking if
 * it has a .code property.
 */
export function isNodeJSErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return error !== undefined && (error as NodeJS.ErrnoException).code !== undefined
}

// TODO: Replace with proper templating system.
export const escapeJSON = (value: cp.Serializable) => JSON.stringify(value).replace(/"/g, "&quot;")

/**
 * Split a string on the first equals.  The result will always be an array with
 * two items regardless of how many equals there are.  The second item will be
 * undefined if empty or missing.
 */
export function splitOnFirstEquals(str: string): [string, string | undefined] {
  const split = str.split(/=(.+)?/, 2)
  return [split[0], split[1]]
}
