import { logger } from "@coder/logger"
import { spawn } from "child_process"
import path from "path"
import split2 from "split2"

const coderCloudAgent = path.resolve(__dirname, "../../lib/coder-cloud-agent")

export async function coderCloudBind(serverName: string): Promise<void> {
  const agent = spawn(coderCloudAgent, ["link", serverName], {
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
          message: `coder cloud agent exited with ${code}`,
        })
        return
      }
      res()
    })
  })
}

export function coderCloudProxy(addr: string) {
  // addr needs to be in host:port format.
  // So we trim the protocol.
  addr = addr.replace(/^https?:\/\//, "")

  const _proxy = async () => {
    const agent = spawn(coderCloudAgent, ["proxy", "--code-server-addr", addr], {
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
            message: `coder cloud agent exited with ${code}`,
          })
          return
        }
        res()
      })
    })
  }

  const proxy = async () => {
    try {
      await _proxy()
    } catch (err) {
      logger.error(err.message)
    }
    setTimeout(proxy, 3000)
  }
  proxy()
}
