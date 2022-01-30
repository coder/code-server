import { logger } from "@coder/logger"
import { spawn } from "child_process"
import path from "path"
import split2 from "split2"

// https://github.com/coder/coder-cloud
const coderCloudAgent = path.resolve(__dirname, "../../lib/coder-cloud-agent")

function runAgent(...args: string[]): Promise<void> {
  logger.debug(`running agent with ${args}`)

  const agent = spawn(coderCloudAgent, args, {
    stdio: ["inherit", "inherit", "pipe"],
  })

  agent.stderr.pipe(split2()).on("data", (line) => {
    line = line.replace(/^[0-9-]+ [0-9:]+ [^ ]+\t/, "")
    logger.info(line)
  })

  return new Promise((res, rej) => {
    agent.on("error", rej)

    agent.on("close", (code) => {
      if (code !== 0) {
        rej({
          message: `--link agent exited with ${code}`,
        })
        return
      }
      res()
    })
  })
}

export function coderCloudBind(address: URL | string, serverName = ""): Promise<void> {
  if (typeof address === "string") {
    throw new Error("Cannot link socket paths")
  }

  // Address needs to be in hostname:port format without the protocol.
  return runAgent("bind", `--code-server-addr=${address.host}`, serverName)
}
