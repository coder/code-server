import { field, logger } from "@coder/logger"
import { ChildProcessWithoutNullStreams } from "child_process"
import http from "http"
import path from "path"
import { Disposable } from "../common/emitter"
import { plural, logError } from "../common/util"
import { createApp, ensureAddress } from "./app"
import { AuthType, DefaultedArgs, Feature } from "./cli"
import { coderCloudBind } from "./coder_cloud"
import { commit, version, vsRootPath } from "./constants"
import { startLink } from "./link"
import { register } from "./routes"
import { humanPath, isFile, loadAMDModule, open } from "./util"

export const shouldSpawnCliProcess = async (args: CodeServerLib.ServerParsedArgs): Promise<boolean> => {
  return (
    !args["start-server"] &&
    (!!args["list-extensions"] ||
      !!args["install-extension"] ||
      !!args["install-builtin-extension"] ||
      !!args["uninstall-extension"] ||
      !!args["locate-extension"])
  )
}

/**
 * This is useful when an CLI arg should be passed to VS Code directly,
 * such as when managing extensions.
 * @deprecated This should be removed when code-server merges with lib/vscode.
 */
export const runVsCodeCli = async (): Promise<void> => {
  logger.debug("Running VS Code CLI")

  // Delete `VSCODE_CWD` very early even before
  // importing bootstrap files. We have seen
  // reports where `code .` would use the wrong
  // current working directory due to our variable
  // somehow escaping to the parent shell
  // (https://github.com/microsoft/vscode/issues/126399)
  delete process.env["VSCODE_CWD"]

  const bootstrap = require(path.join(vsRootPath, "out", "bootstrap"))
  const bootstrapNode = require(path.join(vsRootPath, "out", "bootstrap-node"))
  const product = require(path.join(vsRootPath, "product.json"))

  // Avoid Monkey Patches from Application Insights
  bootstrap.avoidMonkeyPatchFromAppInsights()

  // Enable portable support
  bootstrapNode.configurePortable(product)

  // Enable ASAR support
  bootstrap.enableASARSupport()

  // Signal processes that we got launched as CLI
  process.env["VSCODE_CLI"] = "1"

  const cliProcessMain = await loadAMDModule<CodeServerLib.IMainCli["main"]>("vs/code/node/cli", "initialize")

  try {
    await cliProcessMain(process.argv)
  } catch (error: any) {
    logger.error("Got error from VS Code", error)
  }

  process.exit(0)
}

export const openInExistingInstance = async (args: DefaultedArgs, socketPath: string): Promise<void> => {
  const pipeArgs: CodeServerLib.OpenCommandPipeArgs & { fileURIs: string[] } = {
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

export const runCodeServer = async (
  args: DefaultedArgs,
): Promise<{ dispose: Disposable["dispose"]; server: http.Server }> => {
  logger.info(`code-server ${version} ${commit}`)

  logger.info(`Using user-data-dir ${humanPath(args["user-data-dir"])}`)
  logger.trace(`Using extensions-dir ${humanPath(args["extensions-dir"])}`)

  if (args.auth === AuthType.Password && !args.password && !args["hashed-password"]) {
    throw new Error(
      "Please pass in a password via the config file or environment variable ($PASSWORD or $HASHED_PASSWORD)",
    )
  }

  const app = await createApp(args)
  const serverAddress = ensureAddress(app.server, args.cert ? "https" : "http")
  const disposeRoutes = await register(app, args)

  logger.info(`Using config file ${humanPath(args.config)}`)
  logger.info(`HTTP server listening on ${serverAddress.toString()} ${args.link ? "(randomized by --link)" : ""}`)
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
    await coderCloudBind(serverAddress, args.link.value)
    logger.info("  - Connected to cloud agent")
  }

  let linkAgent: undefined | ChildProcessWithoutNullStreams
  try {
    linkAgent = startLink(serverAddress)
    linkAgent.on("error", (error) => {
      logError(logger, "link daemon", error)
    })
    linkAgent.on("close", (code) => {
      logger.debug("link daemon closed", field("code", code))
    })
  } catch (error) {
    logError(logger, "link daemon", error)
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
      linkAgent?.kill()
      disposeRoutes()
      await app.dispose()
    },
  }
}
