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
  // Spawn the main HTTP server.
  const options = {
    basePath: args["base-path"],
    cert: args.cert,
    certKey: args["cert-key"],
    host: args.host || (args.auth === AuthType.Password && typeof args.cert !== "undefined" ? "0.0.0.0" : "localhost"),
    port: typeof args.port !== "undefined" ? parseInt(args.port, 10) : 8080,
    socket: args.socket,
  }
  if (!options.cert && typeof options.cert !== "undefined") {
    const { cert, certKey } = await generateCertificate()
    options.cert = cert
    options.certKey = certKey
  }
  const httpServer = new HttpServer(options)

  // Register all the providers.
  // TODO: Might be cleaner to be able to register with just the class name
  //       then let HttpServer instantiate with the common arguments.
  const auth = args.auth || AuthType.Password
  const originalPassword = auth === AuthType.Password && (process.env.PASSWORD || (await generatePassword()))
  const password = originalPassword && hash(originalPassword)
  httpServer.registerHttpProvider("/", new MainHttpProvider({ base: "/", auth, password }))
  httpServer.registerHttpProvider("/api", new ApiHttpProvider(httpServer, { base: "/", auth, password }))
  httpServer.registerHttpProvider(
    "/vscode-embed",
    new VscodeHttpProvider([], { base: "/vscode-embed", auth, password })
  )

  ipcMain.onDispose(() => httpServer.dispose())

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

wrap(main)
