import { logger } from "@coder/logger"
import { spawn } from "child_process"
import delay from "delay"
import fs from "fs"
import path from "path"
import split2 from "split2"
import { promisify } from "util"
import xdgBasedir from "xdg-basedir"

const coderCloudAgent = path.resolve(__dirname, "../../lib/coder-cloud-agent")

export async function coderCloudLink(serverName: string): Promise<void> {
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

  if (!xdgBasedir.config) {
    return
  }

  const sessionTokenPath = path.join(xdgBasedir.config, "coder-cloud", "session")

  const _proxy = async () => {
    await waitForPath(sessionTokenPath)

    logger.info("exposing coder-server with coder-cloud")

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

/**
 * waitForPath efficiently implements waiting for the existence of a path.
 *
 * We intentionally do not use fs.watchFile as it is very slow from testing.
 * I believe it polls instead of watching.
 *
 * The way this works is for each level of the path it will check if it exists
 * and if not, it will wait for it. e.g. if the path is /home/nhooyr/.config/coder-cloud/session
 * then first it will check if /home exists, then /home/nhooyr and so on.
 *
 * The wait works by first creating a watch promise for the p segment.
 * We call fs.watch on the dirname of the p segment. When the dirname has a change,
 * we check if the p segment exists and if it does, we resolve the watch promise.
 * On any error or the watcher being closed, we reject the watch promise.
 *
 * Once that promise is setup, we check if the p segment exists with fs.exists
 * and if it does, we close the watcher and return.
 *
 * Now we race the watch promise and a 2000ms delay promise. Once the race
 * is complete, we close the watcher.
 *
 * If the watch promise was the one to resolve, we return.
 * Otherwise we setup the watch promise again and retry.
 *
 * This combination of polling and watching is very reliable and efficient.
 */
async function waitForPath(p: string): Promise<void> {
  const segs = p.split(path.sep)
  for (let i = 0; i < segs.length; i++) {
    const s = path.join("/", ...segs.slice(0, i + 1))
    // We need to wait for each segment to exist.
    await _waitForPath(s)
  }
}

async function _waitForPath(p: string): Promise<void> {
  const watchDir = path.dirname(p)

  logger.debug(`waiting for ${p}`)

  for (;;) {
    const w = fs.watch(watchDir)
    const watchPromise = new Promise<void>((res, rej) => {
      w.on("change", async () => {
        if (await promisify(fs.exists)(p)) {
          res()
        }
      })
      w.on("close", () => rej(new Error("watcher closed")))
      w.on("error", rej)
    })

    // We want to ignore any errors from this promise being rejected if the file
    // already exists below.
    watchPromise.catch(() => {})

    if (await promisify(fs.exists)(p)) {
      // The path exists!
      w.close()
      return
    }

    // Now we wait for either the watch promise to resolve/reject or 2000ms.
    const s = await Promise.race([watchPromise.then(() => "exists"), delay(2000)])
    w.close()
    if (s === "exists") {
      return
    }
  }
}
