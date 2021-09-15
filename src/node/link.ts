import { logger } from "@coder/logger"
import { spawn } from "child_process"
import path from "path"

export function startLink(port: number): Promise<void> {
  logger.debug(`running link targetting ${port}`)

  const agent = spawn(path.resolve(__dirname, "../../lib/linkup"), ["--devurl", `code:${port}:code-server`], {
    shell: false,
  })
  return new Promise((res, rej) => {
    agent.on("error", rej)
    agent.on("close", (code) => {
      if (code !== 0) {
        return rej({
          message: `Link exited with ${code}`,
        })
      }
      res()
    })
  })
}
