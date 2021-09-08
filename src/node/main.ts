import { field, logger } from "@coder/logger"
import * as cp from "child_process"
import http from "http"
import * as path from "path"
import { CliMessage, OpenCommandPipeArgs } from "../../typings/ipc"
import { plural } from "../common/util"
import { createApp, ensureAddress } from "./app"
import { AuthType, DefaultedArgs, Feature } from "./cli"
import { coderCloudBind } from "./coder_cloud"
import { commit, version } from "./constants"
import { register } from "./routes"
import { humanPath, isFile, open } from "./util"

export const runVsCodeCli = (args: DefaultedArgs): void => {
  logger.debug("forking vs code cli...")
  const vscode = cp.fork(path.resolve(__dirname, "../../vendor/modules/code-oss-dev/out/vs/server/fork"), [], {
    env: {
      ...process.env,
      CODE_SERVER_PARENT_PID: process.pid.toString(),
    },
  })
  vscode.once("message", (message: any) => {
    logger.debug("got message from VS Code", field("message", message))
    if (message.type !== "ready") {
      logger.error("Unexpected response waiting for ready response", field("type", message.type))
      process.exit(1)
    }
    const send: CliMessage = { type: "cli", args }
    vscode.send(send)
  })
  vscode.once("error", (error) => {
    logger.error("Got error from VS Code", field("error", error))
    process.exit(1)
  })
  vscode.on("exit", (code) => process.exit(code || 0))
}

export const openInExistingInstance = async (args: DefaultedArgs, socketPath: string): Promise<void> => {
  const pipeArgs: OpenCommandPipeArgs & { fileURIs: string[] } = {
    type: "open",
    folderURIs: [],
    fileURIs: [],
    forceReuseWindow: args["reuse-window"],
    forceNewWindow: args["new-window"],
  }

  for (let i = 0; i < args._.length; i++) {
    const fp = path.resolve(args._[i])
    if (await isFile(fp)) {
      pipeArgs.fileURIs.push(fp)
    } else {
      pipeArgs.folderURIs.push(fp)
    }
  }

  if (pipeArgs.forceNewWindow && pipeArgs.fileURIs.length > 0) {
    logger.error("--new-window can only be used with folder paths")
    process.exit(1)
  }

  if (pipeArgs.folderURIs.length === 0 && pipeArgs.fileURIs.length === 0) {
    logger.error("Please specify at least one file or folder")
    process.exit(1)
  }

  const vscode = http.request(
    {
      path: "/",
      method: "POST",
      socketPath,
    },
    (response) => {
      response.on("data", (message) => {
        logger.debug("got message from VS Code", field("message", message.toString()))
      })
    },
  )
  vscode.on("error", (error: unknown) => {
    logger.error("got error from VS Code", field("error", error))
  })
  vscode.write(JSON.stringify(pipeArgs))
  vscode.end()
}

export const runCodeServer = async (args: DefaultedArgs): Promise<http.Server> => {
  logger.info(`code-server ${version} ${commit}`)

  logger.info(`Using user-data-dir ${humanPath(args["user-data-dir"])}`)
  logger.trace(`Using extensions-dir ${humanPath(args["extensions-dir"])}`)

  if (args.auth === AuthType.Password && !args.password && !args["hashed-password"]) {
    throw new Error(
      "Please pass in a password via the config file or environment variable ($PASSWORD or $HASHED_PASSWORD)",
    )
  }

  const [app, wsApp, server] = await createApp(args)
  const serverAddress = ensureAddress(server)
  await register(app, wsApp, server, args)

  logger.info(`Using config file ${humanPath(args.config)}`)
  logger.info(`HTTP server listening on ${serverAddress} ${args.link ? "(randomized by --link)" : ""}`)
  if (args.auth === AuthType.Password) {
    logger.info("  - Authentication is enabled")
    if (args.usingEnvPassword) {
      logger.info("    - Using password from $PASSWORD")
    } else if (args.usingEnvHashedPassword) {
      logger.info("    - Using password from $HASHED_PASSWORD")
    } else {
      logger.info(`    - Using password from ${humanPath(args.config)}`)
    }
  } else {
    logger.info(`  - Authentication is disabled ${args.link ? "(disabled by --link)" : ""}`)
  }

  if (args.cert) {
    logger.info(`  - Using certificate for HTTPS: ${humanPath(args.cert.value)}`)
  } else {
    logger.info(`  - Not serving HTTPS ${args.link ? "(disabled by --link)" : ""}`)
  }

  if (args["proxy-domain"].length > 0) {
    logger.info(`  - ${plural(args["proxy-domain"].length, "Proxying the following domain")}:`)
    args["proxy-domain"].forEach((domain) => logger.info(`    - *.${domain}`))
  }

  if (args.link) {
    await coderCloudBind(serverAddress.replace(/^https?:\/\//, ""), args.link.value)
    logger.info("  - Connected to cloud agent")
  }

  if (args.enable && args.enable.length > 0) {
    logger.info("Enabling the following experimental features:")
    args.enable.forEach((feature) => {
      if (Object.values(Feature).includes(feature as Feature)) {
        logger.info(`  - "${feature}"`)
      } else {
        logger.error(`  X "${feature}" (unknown feature)`)
      }
    })
    // TODO: Could be nice to add wrapping to the logger?
    logger.info(
      "  The code-server project does not provide stability guarantees or commit to fixing bugs relating to these experimental features. When filing bug reports, please ensure that you can reproduce the bug with all experimental features turned off.",
    )
  }

  if (!args.socket && args.open) {
    // The web socket doesn't seem to work if browsing with 0.0.0.0.
    const openAddress = serverAddress.replace("://0.0.0.0", "://localhost")
    try {
      await open(openAddress)
      logger.info(`Opened ${openAddress}`)
    } catch (error) {
      logger.error("Failed to open", field("address", openAddress), field("error", error))
    }
  }

  return server
}
