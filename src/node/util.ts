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
import { vsRootPath } from "./constants"

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

/**
 * humanPath replaces the home directory in path with ~.
 * Makes it more readable.
 *
 * @param homedir - the home directory(i.e. `os.homedir()`)
 * @param path - a file path
 */
export function humanPath(homedir: string, path?: string): string {
  if (!path) {
    return ""
  }
  return path.replace(homedir, "~")
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
 * @returns {Boolean} boolean if it is WSL
 */
export const isWsl = async (platform: NodeJS.Platform, procVersionFilePath: string): Promise<boolean> => {
  return (
    (platform === "linux" && os.release().toLowerCase().indexOf("microsoft") !== -1) ||
    (await fs.readFile(procVersionFilePath, "utf8")).toLowerCase().indexOf("microsoft") !== -1
  )
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
  const args = [] as string[]
  const options = {} as cp.SpawnOptions
  const platform = (await isWsl(process.platform, "/proc/version")) ? "wsl" : process.platform
  let command = platform === "darwin" ? "open" : "xdg-open"
  if (platform === "win32" || platform === "wsl") {
    command = platform === "wsl" ? "cmd.exe" : "cmd"
    args.push("/c", "start", '""', "/b")
    url.search = url.search.replace(/&/g, "^&")
  }
  const proc = cp.spawn(command, [...args, url.toString()], options)
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

type AMDModule<T> = { [exportName: string]: T }

/**
 * Loads AMD module, typically from a compiled VSCode bundle.
 *
 * @deprecated This should be gradually phased out as code-server migrates to lib/vscode
 * @param amdPath Path to module relative to lib/vscode
 * @param exportName Given name of export in the file
 */
export const loadAMDModule = async <T>(amdPath: string, exportName: string): Promise<T> => {
  // Set default remote native node modules path, if unset
  process.env["VSCODE_INJECT_NODE_MODULE_LOOKUP_PATH"] =
    process.env["VSCODE_INJECT_NODE_MODULE_LOOKUP_PATH"] || path.join(vsRootPath, "remote", "node_modules")

  require(path.join(vsRootPath, "out/bootstrap-node")).injectNodeModuleLookupPath(
    process.env["VSCODE_INJECT_NODE_MODULE_LOOKUP_PATH"],
  )

  const module = await new Promise<AMDModule<T>>((resolve, reject) => {
    require(path.join(vsRootPath, "out/bootstrap-amd")).load(amdPath, resolve, reject)
  })

  return module[exportName] as T
}
