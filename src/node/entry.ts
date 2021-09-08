import { logger } from "@coder/logger"
import {
  optionDescriptions,
  parse,
  readConfigFile,
  setDefaults,
  shouldOpenInExistingInstance,
  shouldRunVsCodeCli,
} from "./cli"
import { commit, version } from "./constants"
import { openInExistingInstance, runCodeServer, runVsCodeCli } from "./main"
import * as proxyAgent from "./proxy_agent"
import { isChild, wrapper } from "./wrapper"

async function entry(): Promise<void> {
  proxyAgent.monkeyPatch(false)

  // There's no need to check flags like --help or to spawn in an existing
  // instance for the child process because these would have already happened in
  // the parent and the child wouldn't have been spawned. We also get the
  // arguments from the parent so we don't have to parse twice and to account
  // for environment manipulation (like how PASSWORD gets removed to avoid
  // leaking to child processes).
  if (isChild(wrapper)) {
    const args = await wrapper.handshake()
    wrapper.preventExit()
    await runCodeServer(args)
    return
  }

  const cliArgs = parse(process.argv.slice(2))
  const configArgs = await readConfigFile(cliArgs.config)
  const args = await setDefaults(cliArgs, configArgs)

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
        vscode: require("../../vendor/modules/code-oss-dev/package.json").version,
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

  return wrapper.start(args)
}

entry().catch((error) => {
  logger.error(error.message)
  wrapper.exit(error)
})
