import * as cp from "child_process"
import * as crypto from "crypto"
import * as fs from "fs-extra"
import * as os from "os"
import * as path from "path"
import * as util from "util"

export const tmpdir = path.join(os.tmpdir(), "code-server")

const getXdgDataDir = (): string => {
  switch (process.platform) {
    case "win32":
      return path.join(process.env.XDG_DATA_HOME || path.join(os.homedir(), "AppData/Local"), "code-server/Data")
    case "darwin":
      return path.join(
        process.env.XDG_DATA_HOME || path.join(os.homedir(), "Library/Application Support"),
        "code-server",
      )
    default:
      return path.join(process.env.XDG_DATA_HOME || path.join(os.homedir(), ".local/share"), "code-server")
  }
}

export const xdgLocalDir = getXdgDataDir()

export const generateCertificate = async (): Promise<{ cert: string; certKey: string }> => {
  const paths = {
    cert: path.join(tmpdir, "self-signed.cert"),
    certKey: path.join(tmpdir, "self-signed.key"),
  }
  const checks = await Promise.all([fs.pathExists(paths.cert), fs.pathExists(paths.certKey)])
  if (!checks[0] || !checks[1]) {
    // Require on demand so openssl isn't required if you aren't going to
    // generate certificates.
    const pem = require("pem") as typeof import("pem")
    const certs = await new Promise<import("pem").CertificateCreationResult>((resolve, reject): void => {
      pem.createCertificate({ selfSigned: true }, (error, result) => {
        return error ? reject(error) : resolve(result)
      })
    })
    await fs.mkdirp(tmpdir)
    await Promise.all([fs.writeFile(paths.cert, certs.certificate), fs.writeFile(paths.certKey, certs.serviceKey)])
  }
  return paths
}

export const generatePassword = async (length = 24): Promise<string> => {
  const buffer = Buffer.alloc(Math.ceil(length / 2))
  await util.promisify(crypto.randomFill)(buffer)
  return buffer.toString("hex").substring(0, length)
}

export const hash = (str: string): string => {
  return crypto
    .createHash("sha256")
    .update(str)
    .digest("hex")
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

export const isWsl = async (): Promise<boolean> => {
  return (
    (process.platform === "linux" &&
      os
        .release()
        .toLowerCase()
        .indexOf("microsoft") !== -1) ||
    (await fs.readFile("/proc/version", "utf8")).toLowerCase().indexOf("microsoft") !== -1
  )
}

/**
 * Try opening a URL using whatever the system has set for opening URLs.
 */
export const open = async (url: string): Promise<void> => {
  const args = [] as string[]
  const options = {} as cp.SpawnOptions
  const platform = (await isWsl()) ? "wsl" : process.platform
  let command = platform === "darwin" ? "open" : "xdg-open"
  if (platform === "win32" || platform === "wsl") {
    command = platform === "wsl" ? "cmd.exe" : "cmd"
    args.push("/c", "start", '""', "/b")
    url = url.replace(/&/g, "^&")
  }
  const proc = cp.spawn(command, [...args, url], options)
  await new Promise((resolve, reject) => {
    proc.on("error", reject)
    proc.on("close", (code) => {
      return code !== 0 ? reject(new Error(`Failed to open with code ${code}`)) : resolve()
    })
  })
}

/**
 * For iterating over an enum's values.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const enumToArray = (t: any): string[] => {
  const values = [] as string[]
  for (const k in t) {
    values.push(t[k])
  }
  return values
}

/**
 * For displaying all allowed options in an enum.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const buildAllowedMessage = (t: any): string => {
  const values = enumToArray(t)
  return `Allowed value${values.length === 1 ? " is" : "s are"} ${values.map((t) => `'${t}'`).join(", ")}`
}

export const isObject = <T extends object>(obj: T): obj is T => {
  return !Array.isArray(obj) && typeof obj === "object" && obj !== null
}

/**
 * Extend a with b and return a new object. Properties with objects will be
 * recursively merged while all other properties are just overwritten.
 */
export function extend<A, B>(a: A, b: B): A & B
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extend(...args: any[]): any {
  const c = {} as any // eslint-disable-line @typescript-eslint/no-explicit-any
  for (const obj of args) {
    if (!isObject(obj)) {
      continue
    }
    for (const key in obj) {
      c[key] = isObject(obj[key]) ? extend(c[key], obj[key]) : obj[key]
    }
  }
  return c
}
