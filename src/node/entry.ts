import { logger } from "@coder/logger"
import { optionDescriptions, parse, readConfigFile, setDefaults, shouldOpenInExistingInstance } from "./cli"
import { commit, pkgName, version } from "./constants"
import { openInExistingInstance, runCodeServer, runVsCodeCli, shouldSpawnCliProcess } from "./main"
import { monkeyPatchProxyProtocols } from "./proxy_agent"
import { loadAMDModule } from "./util"
import { isChild, wrapper } from "./wrapper"

const cliPipe = process.env["VSCODE_IPC_HOOK_CLI"] as string
const cliCommand = process.env["VSCODE_CLIENT_COMMAND"] as string

async function entry(): Promise<void> {
  monkeyPatchProxyProtocols()

  if (cliPipe || cliCommand) {
    const remoteAgentMain = await loadAMDModule<CodeServerLib.RemoteCLIMain>("vs/server/remoteCli", "main")

    remoteAgentMain(
      {
        productName: pkgName,
        version,
        commit,
        executableName: pkgName,
      },
      process.argv.slice(2),
    )
    return
  }

  // There's no need to check flags like --help or to spawn in an existing
  // instance for the child process because these would have already happened in
  // the parent and the child wouldn't have been spawned. We also get the
  // arguments from the parent so we don't have to parse twice and to account
  // for environment manipulation (like how PASSWORD gets removed to avoid
  // leaking to child processes).
  if (isChild(wrapper)) {
    const args = await wrapper.handshake()
    wrapper.preventExit()
    const server = await runCodeServer(args)
    wrapper.onDispose(() => server.dispose())
    return
  }

  const cliArgs = parse(process.argv.slice(2))
  const configArgs = await readConfigFile(cliArgs.config)
  const args = await setDefaults(cliArgs, configArgs)

  if (args.help) {
    console.log("code-server", version, commit)
    console.log("")
    console.log(`Usage: code-server [options] [path]`)
    console.log(`    - Opening a directory: code-server ./path/to/your/project`)
    console.log(`    - Opening a saved workspace: code-server ./path/to/your/project.code-workspace`)
    console.log("")
    console.log("Options")
    optionDescriptions().forEach((description) => {
      console.log("", description)
    })
    return
  }

  if (args.version) {
    if (args.json) {
      console.log(
        JSON.stringify({
          codeServer: version,
          commit,
          vscode: require("../../vendor/modules/code-oss-dev/package.json").version,
        }),
      )
    } else {
      console.log(version, commit)
    }
    return
  }

  if (shouldSpawnCliProcess(args)) {
    logger.debug("Found VS Code arguments; spawning VS Code CLI")
    return runVsCodeCli(args)
  }

  const socketPath = await shouldOpenInExistingInstance(cliArgs)
  if (socketPath) {
    logger.debug("Trying to open in existing instance")
    return openInExistingInstance(args, socketPath)
  }

  return wrapper.start(args)
}

entry().catch((error) => {
  logger.error(error.message)
  wrapper.exit(error)
})
