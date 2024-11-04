import { field, logger } from "@coder/logger"
import http from "http"
import * as path from "path"
import { Disposable } from "../common/emitter"
import { plural } from "../common/util"
import { createApp, ensureAddress } from "./app"
import { AuthType, DefaultedArgs, Feature, toCodeArgs, UserProvidedArgs } from "./cli"
import { commit, version, vsRootPath } from "./constants"
import { register } from "./routes"
import { VSCodeModule } from "./routes/vscode"
import { isDirectory, open } from "./util"

/**
 * Return true if the user passed an extension-related VS Code flag.
 */
export const shouldSpawnCliProcess = (args: UserProvidedArgs): boolean => {
  return (
    !!args["list-extensions"] ||
    !!args["install-extension"] ||
    !!args["uninstall-extension"] ||
    !!args["locate-extension"]
  )
}

/**
 * This is copy of OpenCommandPipeArgs from
 * ../../lib/vscode/src/vs/workbench/api/node/extHostCLIServer.ts:15
 *
 * Arguments supported by Code's socket.  It can be used to perform actions from
 * the CLI in a running instance of Code (for example to open a file).
 *
 * TODO: Can we import this (and other types) directly?
 */
export interface OpenCommandPipeArgs {
  type: "open"
  fileURIs?: string[]
  folderURIs: string[]
  forceNewWindow?: boolean
  diffMode?: boolean
  addMode?: boolean
  gotoLineMode?: boolean
  forceReuseWindow?: boolean
  waitMarkerFilePath?: string
}

/**
 * Run Code's CLI for things like managing extensions.
 */
export const runCodeCli = async (args: DefaultedArgs): Promise<void> => {
  logger.debug("Running Code CLI")
  try {
    // See vscode.loadVSCode for more on this jank.
    process.env.CODE_SERVER_PARENT_PID = process.pid.toString()
    const modPath = path.join(vsRootPath, "out/server-main.js")
    const mod = (await eval(`import("${modPath}")`)) as VSCodeModule
    const serverModule = await mod.loadCodeWithNls()
    await serverModule.spawnCli(await toCodeArgs(args))
    // Rather than have the caller handle errors and exit, spawnCli will exit
    // itself.  Additionally, it does this on a timeout set to 0.  So, try
    // waiting for VS Code to exit before giving up and doing it ourselves.
    await new Promise((r) => setTimeout(r, 1000))
    logger.warn("Code never exited")
    process.exit(0)
  } catch (error: any) {
    // spawnCli catches all errors, but just in case that changes.
    logger.error("Got error from Code", error)
    process.exit(1)
  }
}

export const openInExistingInstance = async (args: DefaultedArgs, socketPath: string): Promise<void> => {
  const pipeArgs: OpenCommandPipeArgs & { fileURIs: string[] } = {
    type: "open",
    folderURIs: [],
    fileURIs: [],
    forceReuseWindow: args["reuse-window"],
    forceNewWindow: args["new-window"],
    gotoLineMode: true,
  }
  for (let i = 0; i < args._.length; i++) {
    const fp = args._[i]
    if (await isDirectory(fp)) {
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
        logger.debug("got message from Code", field("message", message.toString()))
      })
    },
  )
  vscode.on("error", (error: unknown) => {
    logger.error("got error from Code", field("error", error))
  })
  vscode.write(JSON.stringify(pipeArgs))
  vscode.end()
}

export const runCodeServer = async (
  args: DefaultedArgs,
): Promise<{ dispose: Disposable["dispose"]; server: http.Server }> => {
  logger.info(`code-server ${version} ${commit}`)

  logger.info(`Using user-data-dir ${args["user-data-dir"]}`)
  logger.debug(`Using extensions-dir ${args["extensions-dir"]}`)

  if (args.auth === AuthType.Password && !args.password && !args["hashed-password"]) {
    throw new Error(
      "Please pass in a password via the config file or environment variable ($PASSWORD or $HASHED_PASSWORD)",
    )
  }

  const app = await createApp(args)
  const protocol = args.cert ? "https" : "http"
  const serverAddress = ensureAddress(app.server, protocol)
  const disposeRoutes = await register(app, args)

  logger.info(`Using config file ${args.config}`)
  logger.info(`${protocol.toUpperCase()} server listening on ${serverAddress.toString()}`)
  if (args.auth === AuthType.Password) {
    logger.info("  - Authentication is enabled")
    if (args.usingEnvPassword) {
      logger.info("    - Using password from $PASSWORD")
    } else if (args.usingEnvHashedPassword) {
      logger.info("    - Using password from $HASHED_PASSWORD")
    } else {
      logger.info(`    - Using password from ${args.config}`)
    }
  } else {
    logger.info("  - Authentication is disabled")
  }

  if (args.cert) {
    logger.info(`  - Using certificate for HTTPS: ${args.cert.value}`)
  } else {
    logger.info("  - Not serving HTTPS")
  }

  if (args["disable-proxy"]) {
    logger.info("  - Proxy disabled")
  } else if (args["proxy-domain"].length > 0) {
    logger.info(`  - ${plural(args["proxy-domain"].length, "Proxying the following domain")}:`)
    args["proxy-domain"].forEach((domain) => logger.info(`    - ${domain}`))
  }
  if (process.env.VSCODE_PROXY_URI) {
    logger.info(`Using proxy URI in PORTS tab: ${process.env.VSCODE_PROXY_URI}`)
  }

  const sessionServerAddress = app.editorSessionManagerServer.address()
  if (sessionServerAddress) {
    logger.info(`Session server listening on ${sessionServerAddress.toString()}`)
  }

  if (process.env.EXTENSIONS_GALLERY) {
    logger.info("Using custom extensions gallery")
    logger.debug(`  - ${process.env.EXTENSIONS_GALLERY}`)
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

  if (args.open) {
    try {
      await open(serverAddress)
      logger.info(`Opened ${serverAddress}`)
    } catch (error) {
      logger.error("Failed to open", field("address", serverAddress.toString()), field("error", error))
    }
  }

  return {
    server: app.server,
    dispose: async () => {
      disposeRoutes()
      await app.dispose()
    },
  }
}
