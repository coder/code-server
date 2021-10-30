import { logger } from "@coder/logger"
import { ChildProcessWithoutNullStreams, spawn } from "child_process"
import path from "path"

export function startLink(address: URL | string): ChildProcessWithoutNullStreams {
  if (typeof address === "string") {
    throw new Error("Cannot link socket paths")
  }

  const port = parseInt(address.port, 10)
  logger.debug(`running link targeting ${port}`)

  return spawn(path.resolve(__dirname, "../../lib/linkup"), ["--devurl", `code:${port}:code-server`], {
    shell: false,
  })
}
