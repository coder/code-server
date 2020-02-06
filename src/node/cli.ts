import * as path from "path"
import { logger, Level } from "@coder/logger"
import { Args as VsArgs } from "../../lib/vscode/src/vs/server/ipc"
import { AuthType } from "./http"
import { xdgLocalDir } from "./util"

export interface Args extends VsArgs {
  auth?: AuthType
  "base-path"?: string
  cert?: string
  "cert-key"?: string
  format?: string
  host?: string
  json?: boolean
  open?: boolean
  port?: string
  socket?: string
  version?: boolean
  _: string[]
}

// TODO: Implement proper CLI parser.
export const parse = (): Args => {
  const last = process.argv[process.argv.length - 1]
  const userDataDir = xdgLocalDir
  const verbose = process.argv.includes("--verbose")
  const trace = process.argv.includes("--trace")

  if (verbose || trace) {
    process.env.LOG_LEVEL = "trace"
    logger.level = Level.Trace
  }

  return {
    "extensions-dir": path.join(userDataDir, "extensions"),
    "user-data-dir": userDataDir,
    _: last && !last.startsWith("-") ? [last] : [],
    json: process.argv.includes("--json"),
    log: process.env.LOG_LEVEL,
    trace,
    verbose,
    version: process.argv.includes("--version"),
  }
}
