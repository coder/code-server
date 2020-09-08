import { spawn } from "child_process"
import path from "path"
import { logger } from "@coder/logger"
import split2 from "split2"

export async function coderCloudExpose(serverName: string): Promise<void> {
  const coderCloudAgent = path.resolve(__dirname, "../../lib/coder-cloud-agent")
  const agent = spawn(coderCloudAgent, ["link", serverName], {
    stdio: ["inherit", "inherit", "pipe"],
  })

  agent.stderr.pipe(split2()).on("data", line => {
    line = line.replace(/^[0-9-]+ [0-9:]+ [^ ]+\t/, "")
    logger.info(line)
  })

  return new Promise((res, rej) => {
    agent.on("error", rej)

    agent.on("close", code => {
      if (code !== 0) {
        rej({
          message: `coder cloud agent exited with ${code}`,
        })
        return
      }
      res()
    })
  })
}
