import { logger } from "@coder/logger"
import { ChildProcessWithoutNullStreams, spawn } from "child_process"
import path from "path"

export function startLink(port: number): ChildProcessWithoutNullStreams {
  logger.debug(`running link targetting ${port}`)

  return spawn(path.resolve(__dirname, "../../lib/linkup"), ["--devurl", `code:${port}:code-server`], {
    shell: false,
  })
}
