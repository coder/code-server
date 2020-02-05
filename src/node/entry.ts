import { logger } from "@coder/logger"
import { ApiHttpProvider } from "./api/server"
import { MainHttpProvider } from "./app/server"
import { AuthType, HttpServer } from "./http"
import { generateCertificate, generatePassword, hash, open } from "./util"
import { VscodeHttpProvider } from "./vscode/server"
import { ipcMain, wrap } from "./wrapper"

export interface Args {
  auth?: AuthType
  "base-path"?: string
  cert?: string
  "cert-key"?: string
  format?: string
  host?: string
  open?: boolean
  port?: string
  socket?: string
  _?: string[]
}

const main = async (args: Args = {}): Promise<void> => {
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
    basePath: args["base-path"],
    cert: args.cert,
    certKey: args["cert-key"],
    commit: commit || "development",
    host: args.host || (args.auth === AuthType.Password && typeof args.cert !== "undefined" ? "0.0.0.0" : "localhost"),
    password: originalPassword ? hash(originalPassword) : undefined,
    port: typeof args.port !== "undefined" ? parseInt(args.port, 10) : 8080,
    socket: args.socket,
  }
  if (!options.cert && typeof options.cert !== "undefined") {
    const { cert, certKey } = await generateCertificate()
    options.cert = cert
    options.certKey = certKey
  }

  const httpServer = new HttpServer(options)
  httpServer.registerHttpProvider("/", MainHttpProvider)
  httpServer.registerHttpProvider("/api", ApiHttpProvider, httpServer)
  httpServer.registerHttpProvider("/vscode-embed", VscodeHttpProvider, [])

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
      args.cert
        ? `  - Using provided certificate${args["cert-key"] ? " and key" : ""} for HTTPS`
        : `  - Using generated certificate and key for HTTPS`
    )
  } else {
    logger.info("  - Not serving HTTPS")
  }

  if (serverAddress && !options.socket && args.open) {
    // The web socket doesn't seem to work if browsing with 0.0.0.0.
    const openAddress = serverAddress.replace(/:\/\/0.0.0.0/, "://localhost")
    await open(openAddress).catch(console.error)
    logger.info(`  - Opened ${openAddress}`)
  }
}

// TODO: Implement CLI parser.
if (process.argv.includes("--version")) {
  const version = require("../../package.json").version
  if (process.argv.includes("--json")) {
    console.log({
      codeServer: version,
      vscode: require("../../lib/vscode/package.json").version,
    })
  } else {
    console.log(version)
  }
  process.exit(0)
} else {
  wrap(main)
}
