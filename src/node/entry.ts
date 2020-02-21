import { field, logger } from "@coder/logger"
import * as cp from "child_process"
import * as path from "path"
import { CliMessage } from "../../lib/vscode/src/vs/server/ipc"
import { ApiHttpProvider } from "./app/api"
import { MainHttpProvider } from "./app/app"
import { LoginHttpProvider } from "./app/login"
import { UpdateHttpProvider } from "./app/update"
import { VscodeHttpProvider } from "./app/vscode"
import { Args, optionDescriptions, parse } from "./cli"
import { AuthType, HttpServer } from "./http"
import { generateCertificate, generatePassword, hash, open } from "./util"
import { ipcMain, wrap } from "./wrapper"

const main = async (args: Args): Promise<void> => {
  // For any future forking bypass nbin and drop straight to Node.
  process.env.NBIN_BYPASS = "true"

  const auth = args.auth || AuthType.Password
  const originalPassword = auth === AuthType.Password && (process.env.PASSWORD || (await generatePassword()))

  let commit: string | undefined
  try {
    commit = require("../../package.json").commit
  } catch (error) {
    logger.warn(error.message)
  }

  // Spawn the main HTTP server.
  const options = {
    auth,
    cert: args.cert ? args.cert.value : undefined,
    certKey: args["cert-key"],
    commit: commit || "development",
    host: args.host || (args.auth === AuthType.Password && typeof args.cert !== "undefined" ? "0.0.0.0" : "localhost"),
    password: originalPassword ? hash(originalPassword) : undefined,
    port: typeof args.port !== "undefined" ? args.port : process.env.PORT !== "" ? process.env.PORT : 8080,
    socket: args.socket,
  }
  if (!options.cert && args.cert) {
    const { cert, certKey } = await generateCertificate()
    options.cert = cert
    options.certKey = certKey
  }

  const httpServer = new HttpServer(options)
  const api = httpServer.registerHttpProvider("/api", ApiHttpProvider, httpServer, args["user-data-dir"])
  const update = httpServer.registerHttpProvider("/update", UpdateHttpProvider, !args["disable-updates"])
  httpServer.registerHttpProvider("/vscode", VscodeHttpProvider, args)
  httpServer.registerHttpProvider("/login", LoginHttpProvider)
  httpServer.registerHttpProvider("/", MainHttpProvider, api, update)

  ipcMain().onDispose(() => httpServer.dispose())

  const serverAddress = await httpServer.listen()
  logger.info(`Server listening on ${serverAddress}`)

  if (auth === AuthType.Password && !process.env.PASSWORD) {
    logger.info(`  - Password is ${originalPassword}`)
    logger.info("    - To use your own password, set the PASSWORD environment variable")
    if (!args.auth) {
      logger.info("    - To disable use `--auth none`")
    }
  } else if (auth === AuthType.Password) {
    logger.info("  - Using custom password for authentication")
  } else {
    logger.info("  - No authentication")
  }

  if (httpServer.protocol === "https") {
    logger.info(
      typeof args.cert === "string"
        ? `  - Using provided certificate${args["cert-key"] ? " and key" : ""} for HTTPS`
        : `  - Using generated certificate and key for HTTPS`,
    )
  } else {
    logger.info("  - Not serving HTTPS")
  }

  logger.info(`  - Automatic updates are ${update.enabled ? "enabled" : "disabled"}`)

  if (serverAddress && !options.socket && args.open) {
    // The web socket doesn't seem to work if browsing with 0.0.0.0.
    const openAddress = serverAddress.replace(/:\/\/0.0.0.0/, "://localhost")
    await open(openAddress).catch(console.error)
    logger.info(`  - Opened ${openAddress}`)
  }
}

const tryParse = (): Args => {
  try {
    return parse(process.argv.slice(2))
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}

const args = tryParse()
if (args.help) {
  console.log("code-server", require("../../package.json").version)
  console.log("")
  console.log(`Usage: code-server [options] [path]`)
  console.log("")
  console.log("Options")
  optionDescriptions().forEach((description) => {
    console.log("", description)
  })
} else if (args.version) {
  const version = require("../../package.json").version
  if (args.json) {
    console.log({
      codeServer: version,
      vscode: require("../../lib/vscode/package.json").version,
    })
  } else {
    console.log(version)
  }
  process.exit(0)
} else if (args["list-extensions"] || args["install-extension"] || args["uninstall-extension"]) {
  process.env.NBIN_BYPASS = "true"
  logger.debug("forking vs code cli...")
  const vscode = cp.fork(path.resolve(__dirname, "../../lib/vscode/out/vs/server/fork"), [], {
    env: {
      ...process.env,
      CODE_SERVER_PARENT_PID: process.pid.toString(),
    },
  })
  vscode.once("message", (message) => {
    logger.debug("Got message from VS Code", field("message", message))
    if (message.type !== "ready") {
      logger.error("Unexpected response waiting for ready response")
      process.exit(1)
    }
    const send: CliMessage = { type: "cli", args }
    vscode.send(send)
  })
  vscode.once("error", (error) => {
    logger.error(error.message)
    process.exit(1)
  })
  vscode.on("exit", (code) => process.exit(code || 0))
} else {
  wrap(() => main(args))
}
