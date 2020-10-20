import { field, logger } from "@coder/logger"
import * as cp from "child_process"
import { promises as fs } from "fs"
import http from "http"
import * as path from "path"
import { CliMessage, OpenCommandPipeArgs } from "../../lib/vscode/src/vs/server/ipc"
import { plural } from "../common/util"
import { createApp, ensureAddress } from "./app"
import {
  AuthType,
  DefaultedArgs,
  optionDescriptions,
  parse,
  readConfigFile,
  setDefaults,
  shouldOpenInExistingInstance,
  shouldRunVsCodeCli,
} from "./cli"
import { coderCloudBind } from "./coder-cloud"
import { commit, version } from "./constants"
import { register } from "./routes"
import { humanPath, open } from "./util"
import { ipcMain, WrapperProcess } from "./wrapper"

export const runVsCodeCli = (args: DefaultedArgs): void => {
  logger.debug("forking vs code cli...")
  const vscode = cp.fork(path.resolve(__dirname, "../../lib/vscode/out/vs/server/fork"), [], {
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

  const isDir = async (path: string): Promise<boolean> => {
    try {
      const st = await fs.stat(path)
      return st.isDirectory()
    } catch (error) {
      return false
    }
  }

  for (let i = 0; i < args._.length; i++) {
    const fp = path.resolve(args._[i])
    if (await isDir(fp)) {
      pipeArgs.folderURIs.push(fp)
    } else {
      pipeArgs.fileURIs.push(fp)
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

const main = async (args: DefaultedArgs): Promise<void> => {
  logger.info(`code-server ${version} ${commit}`)

  logger.info(`Using user-data-dir ${humanPath(args["user-data-dir"])}`)
  logger.trace(`Using extensions-dir ${humanPath(args["extensions-dir"])}`)

  if (args.auth === AuthType.Password && !args.password) {
    throw new Error("Please pass in a password via the config file or $PASSWORD")
  }

  ipcMain.onDispose(() => {
    //  TODO: register disposables
  })

  const [app, server] = await createApp(args)
  const serverAddress = ensureAddress(server)
  await register(app, server, args)

  logger.info(`Using config file ${humanPath(args.config)}`)
  logger.info(`HTTP server listening on ${serverAddress} ${args.link ? "(randomized by --link)" : ""}`)

  if (args.auth === AuthType.Password) {
    logger.info("  - Authentication is enabled")
    if (args.usingEnvPassword) {
      logger.info("    - Using password from $PASSWORD")
    } else {
      logger.info(`    - Using password from ${humanPath(args.config)}`)
    }
  } else {
    logger.info(`  - Authentication is disabled ${args.link ? "(disabled by --link)" : ""}`)
  }

  if (args.cert) {
    logger.info(
      args.cert && args.cert.value
        ? `  - Using provided certificate and key for HTTPS`
        : `  - Using generated certificate and key for HTTPS`,
    )
  } else {
    logger.info("  - Not serving HTTPS")
  }

  if (args["proxy-domain"].length > 0) {
    logger.info(`  - ${plural(args["proxy-domain"].length, "Proxying the following domain")}:`)
    args["proxy-domain"].forEach((domain) => logger.info(`    - *.${domain}`))
  }

  if (args.link) {
    try {
      await coderCloudBind(serverAddress, args.link.value)
      logger.info("  - Connected to cloud agent")
    } catch (err) {
      logger.error(err.message)
      ipcMain.exit(1)
    }
  }

  if (serverAddress && !args.socket && args.open) {
    // The web socket doesn't seem to work if browsing with 0.0.0.0.
    const openAddress = serverAddress.replace(/:\/\/0.0.0.0/, "://localhost")
    await open(openAddress).catch((error: Error) => {
      logger.error("Failed to open", field("address", openAddress), field("error", error))
    })
    logger.info(`Opened ${openAddress}`)
  }
}

async function entry(): Promise<void> {
  const cliArgs = parse(process.argv.slice(2))
  const configArgs = await readConfigFile(cliArgs.config)
  const args = await setDefaults(cliArgs, configArgs)

  // There's no need to check flags like --help or to spawn in an existing
  // instance for the child process because these would have already happened in
  // the parent and the child wouldn't have been spawned.
  if (ipcMain.isChild) {
    await ipcMain.handshake()
    ipcMain.preventExit()
    return main(args)
  }

  if (args.help) {
    console.log("code-server", version, commit)
    console.log("")
    console.log(`Usage: code-server [options] [path]`)
    console.log("")
    console.log("Options")
    optionDescriptions().forEach((description) => {
      console.log("", description)
    })
    return
  }

  if (args.version) {
    if (args.json) {
      console.log({
        codeServer: version,
        commit,
        vscode: require("../../lib/vscode/package.json").version,
      })
    } else {
      console.log(version, commit)
    }
    return
  }

  if (shouldRunVsCodeCli(args)) {
    return runVsCodeCli(args)
  }

  const socketPath = await shouldOpenInExistingInstance(cliArgs)
  if (socketPath) {
    return openInExistingInstance(args, socketPath)
  }

  const wrapper = new WrapperProcess(require("../../package.json").version)
  return wrapper.start()
}

entry().catch((error) => {
  logger.error(error.message)
  ipcMain.exit(error)
})
