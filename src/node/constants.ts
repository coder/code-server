import { logger } from "@coder/logger"
import type { JSONSchemaForNPMPackageJsonFiles } from "@schemastore/package"
import * as os from "os"
import * as path from "path"

export function getPackageJson(relativePath: string): JSONSchemaForNPMPackageJsonFiles {
  let pkg = {}
  try {
    pkg = require(relativePath)
  } catch (error: any) {
    logger.warn(error.message)
  }

  return pkg
}

export const rootPath = path.resolve(__dirname, "../..")
export const vsRootPath = path.join(rootPath, "lib/vscode")
const PACKAGE_JSON = "package.json"
const pkg = getPackageJson(`${rootPath}/${PACKAGE_JSON}`)
const codePkg = getPackageJson(`${vsRootPath}/${PACKAGE_JSON}`) || { version: "0.0.0" }
export const version = pkg.version || "development"
export const commit = pkg.commit || "development"
export const codeVersion = codePkg.version || "development"
export const tmpdir = path.join(os.tmpdir(), "code-server")
export const isDevMode = commit === "development"
export const httpProxyUri =
  process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy

/**
 * getVersionString returns a human-readable version string suitable
 * for outputting to the console.
 */
export function getVersionString(): string {
  return [version, commit, "with Code", codeVersion].join(" ")
}

/**
 * getVersionJsonString returns a machine-readable version string
 * suitable for outputting to the console.
 */
export function getVersionJsonString(): string {
  return JSON.stringify({
    codeServer: version,
    commit,
    vscode: codeVersion,
  })
}
