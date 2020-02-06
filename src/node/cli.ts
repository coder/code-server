import { AuthType } from "./http"
import { Args as VsArgs } from "../../lib/vscode/src/vs/server/ipc"

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
  return {
    version: process.argv.includes("--version"),
    json: process.argv.includes("--json"),
    _: last && !last.startsWith("-") ? [last] : [],
  }
}
