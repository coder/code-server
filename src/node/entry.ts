import { field, logger } from "@coder/logger"
import * as cp from "child_process"
import { promises as fs } from "fs"
import http from "http"
import * as path from "path"
import { CliMessage, OpenCommandPipeArgs } from "../../lib/vscode/src/vs/server/ipc"
import { plural } from "../common/util"
import { HealthHttpProvider } from "./app/health"
import { LoginHttpProvider } from "./app/login"
import { ProxyHttpProvider } from "./app/proxy"
import { StaticHttpProvider } from "./app/static"
import { UpdateHttpProvider } from "./app/update"
import { VscodeHttpProvider } from "./app/vscode"
import {
  Args,
  bindAddrFromAllSources,
  optionDescriptions,
  parse,
  readConfigFile,
  setDefaults,
  shouldOpenInExistingInstance,
  shouldRunVsCodeCli,
} from "./cli"
import { coderCloudBind } from "./coder-cloud"
import { AuthType, HttpServer, HttpServerOptions } from "./http"
import { loadPlugins } from "./plugin"
import { generateCertificate, hash, humanPath, open } from "./util"
import { ipcMain, WrapperProcess } from "./wrapper"

let pkg: { version?: string; commit?: string } = {}
try {
  pkg = require("../../package.json")
} catch (error) {
  logger.warn(error.message)
}

const version = pkg.version || "development"
const commit = pkg.commit || "development"

export const runVsCodeCli = (args: Args): void => {
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

export const openInExistingInstance = async (args: Args, socketPath: string): Promise<void> => {
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

const main = async (args: Args, configArgs: Args): Promise<void> => {
  if (args.link) {
    // If we're being exposed to the cloud, we listen on a random address and disable auth.
    args = {
      ...args,
      host: "localhost",
      port: 0,
      auth: AuthType.None,
      socket: undefined,
      cert: undefined,
    }
    logger.info("link: disabling auth and listening on random localhost port for cloud agent")
  }

  if (!args.auth) {
    args = {
      ...args,
      auth: AuthType.Password,
    }
  }

  logger.info(`Using user-data-dir ${humanPath(args["user-data-dir"])}`)

  logger.trace(`Using extensions-dir ${humanPath(args["extensions-dir"])}`)

  const envPassword = !!process.env.PASSWORD
  const password = args.auth === AuthType.Password && (process.env.PASSWORD || args.password)
  if (args.auth === AuthType.Password && !password) {
    throw new Error("Please pass in a password via the config file or $PASSWORD")
  }
  const [host, port] = bindAddrFromAllSources(args, configArgs)

  // Spawn the main HTTP server.
  const options: HttpServerOptions = {
    auth: args.auth,
    commit,
    host: host,
    // The hash does not add any actual security but we do it for obfuscation purposes.
    password: password ? hash(password) : undefined,
    port: port,
    proxyDomains: args["proxy-domain"],
    socket: args.socket,
    ...(args.cert && !args.cert.value
      ? await generateCertificate(args["cert-host"] || "localhost")
      : {
          cert: args.cert && args.cert.value,
          certKey: args["cert-key"],
        }),
  }

  if (options.cert && !options.certKey) {
    throw new Error("--cert-key is missing")
  }

  const httpServer = new HttpServer(options)
  httpServer.registerHttpProvider(["/", "/vscode"], VscodeHttpProvider, args)
  httpServer.registerHttpProvider("/update", UpdateHttpProvider, false)
  httpServer.registerHttpProvider("/proxy", ProxyHttpProvider)
  httpServer.registerHttpProvider("/login", LoginHttpProvider, args.config!, envPassword)
  httpServer.registerHttpProvider("/static", StaticHttpProvider)
  httpServer.registerHttpProvider("/healthz", HealthHttpProvider, httpServer.heart)

  await loadPlugins(httpServer, args)

  ipcMain.onDispose(() => {
    httpServer.dispose().then((errors) => {
      errors.forEach((error) => logger.error(error.message))
    })
  })

  logger.info(`code-server ${version} ${commit}`)
  logger.info(`Using config file ${humanPath(args.config)}`)

  const serverAddress = await httpServer.listen()
  logger.info(`HTTP server listening on ${serverAddress}`)

  if (args.auth === AuthType.Password) {
    if (envPassword) {
      logger.info("    - Using password from $PASSWORD")
    } else {
      logger.info(`    - Using password from ${humanPath(args.config)}`)
    }
    logger.info("    - To disable use `--auth none`")
  } else {
    logger.info("  - No authentication")
  }
  delete process.env.PASSWORD

  if (httpServer.protocol === "https") {
    logger.info(
      args.cert && args.cert.value
        ? `  - Using provided certificate and key for HTTPS`
        : `  - Using generated certificate and key for HTTPS: ${humanPath(options.cert)}`,
    )
  } else {
    logger.info("  - Not serving HTTPS")
  }

  if (httpServer.proxyDomains.size > 0) {
    logger.info(`  - ${plural(httpServer.proxyDomains.size, "Proxying the following domain")}:`)
    httpServer.proxyDomains.forEach((domain) => logger.info(`    - *.${domain}`))
  }

  if (serverAddress && !options.socket && args.open) {
    // The web socket doesn't seem to work if browsing with 0.0.0.0.
    const openAddress = serverAddress.replace(/:\/\/0.0.0.0/, "://localhost")
    await open(openAddress).catch((error: Error) => {
      logger.error("Failed to open", field("address", openAddress), field("error", error))
    })
    logger.info(`Opened ${openAddress}`)
  }

  if (args.link) {
    try {
      await coderCloudBind(serverAddress!, args.link.value)
    } catch (err) {
      logger.error(err.message)
      ipcMain.exit(1)
    }
  }
}

async function entry(): Promise<void> {
  const cliArgs = parse(process.argv.slice(2))
  const configArgs = await readConfigFile(cliArgs.config)
  // This prioritizes the flags set in args over the ones in the config file.
  let args = Object.assign(configArgs, cliArgs)
  args = await setDefaults(args)

  // There's no need to check flags like --help or to spawn in an existing
  // instance for the child process because these would have already happened in
  // the parent and the child wouldn't have been spawned.
  if (ipcMain.isChild) {
    await ipcMain.handshake()
    ipcMain.preventExit()
    return main(args, configArgs)
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
