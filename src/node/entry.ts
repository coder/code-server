import { field, logger } from "@coder/logger"
import * as cp from "child_process"
import * as path from "path"
import { CliMessage } from "../../lib/vscode/src/vs/server/ipc"
import { ApiHttpProvider } from "./app/api"
import { DashboardHttpProvider } from "./app/dashboard"
import { LoginHttpProvider } from "./app/login"
import { ProxyHttpProvider } from "./app/proxy"
import { StaticHttpProvider } from "./app/static"
import { UpdateHttpProvider } from "./app/update"
import { VscodeHttpProvider } from "./app/vscode"
import { Args, optionDescriptions, parse } from "./cli"
import { AuthType, HttpServer, HttpServerOptions } from "./http"
import { SshProvider } from "./ssh/server"
import { generateCertificate, generatePassword, generateSshHostKey, hash, open } from "./util"
import { ipcMain, wrap } from "./wrapper"

process.on("uncaughtException", (error) => {
  logger.error(`Uncaught exception: ${error.message}`)
  if (typeof error.stack !== "undefined") {
    logger.error(error.stack)
  }
})

let pkg: { version?: string; commit?: string } = {}
try {
  pkg = require("../../package.json")
} catch (error) {
  logger.warn(error.message)
}

const version = pkg.version || "development"
const commit = pkg.commit || "development"

const main = async (args: Args): Promise<void> => {
  const auth = args.auth || AuthType.Password
  const originalPassword = auth === AuthType.Password && (process.env.PASSWORD || (await generatePassword()))

  // Spawn the main HTTP server.
  const options: HttpServerOptions = {
    auth,
    commit,
    host: args.host || (args.auth === AuthType.Password && typeof args.cert !== "undefined" ? "0.0.0.0" : "localhost"),
    password: originalPassword ? hash(originalPassword) : undefined,
    port: typeof args.port !== "undefined" ? args.port : process.env.PORT ? parseInt(process.env.PORT, 10) : 8080,
    proxyDomains: args["proxy-domain"],
    socket: args.socket,
    ...(args.cert && !args.cert.value
      ? await generateCertificate()
      : {
          cert: args.cert && args.cert.value,
          certKey: args["cert-key"],
        }),
  }

  if (options.cert && !options.certKey) {
    throw new Error("--cert-key is missing")
  }

  const httpServer = new HttpServer(options)
  const vscode = httpServer.registerHttpProvider("/", VscodeHttpProvider, args)
  const api = httpServer.registerHttpProvider("/api", ApiHttpProvider, httpServer, vscode, args["user-data-dir"])
  const update = httpServer.registerHttpProvider("/update", UpdateHttpProvider, !args["disable-updates"])
  httpServer.registerHttpProvider("/proxy", ProxyHttpProvider)
  httpServer.registerHttpProvider("/login", LoginHttpProvider)
  httpServer.registerHttpProvider("/static", StaticHttpProvider)
  httpServer.registerHttpProvider("/dashboard", DashboardHttpProvider, api, update)

  ipcMain().onDispose(() => httpServer.dispose())

  logger.info(`code-server ${version} ${commit}`)
  const serverAddress = await httpServer.listen()
  logger.info(`HTTP server listening on ${serverAddress}`)

  if (auth === AuthType.Password && !process.env.PASSWORD) {
    logger.info(`  - Password is ${originalPassword}`)
    logger.info("    - To use your own password set the PASSWORD environment variable")
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
      args.cert && args.cert.value
        ? `  - Using provided certificate and key for HTTPS`
        : `  - Using generated certificate and key for HTTPS`,
    )
  } else {
    logger.info("  - Not serving HTTPS")
  }

  if (httpServer.proxyDomains.size > 0) {
    logger.info(`  - Proxying the following domain${httpServer.proxyDomains.size === 1 ? "" : "s"}:`)
    httpServer.proxyDomains.forEach((domain) => logger.info(`    - *.${domain}`))
  }

  logger.info(`Automatic updates are ${update.enabled ? "enabled" : "disabled"}`)

  let sshHostKey = args["ssh-host-key"]
  if (!args["disable-ssh"] && !sshHostKey) {
    try {
      sshHostKey = await generateSshHostKey()
    } catch (error) {
      logger.error("Unable to start SSH server", field("error", error.message))
    }
  }

  let sshPort: number | undefined
  if (!args["disable-ssh"] && sshHostKey) {
    const sshProvider = httpServer.registerHttpProvider("/ssh", SshProvider, sshHostKey)
    try {
      sshPort = await sshProvider.listen()
    } catch (error) {
      logger.warn(`SSH server: ${error.message}`)
    }
  }

  if (typeof sshPort !== "undefined") {
    logger.info(`SSH server listening on localhost:${sshPort}`)
    logger.info("  - To disable use `--disable-ssh`")
  } else {
    logger.info("SSH server disabled")
  }

  if (serverAddress && !options.socket && args.open) {
    // The web socket doesn't seem to work if browsing with 0.0.0.0.
    const openAddress = serverAddress.replace(/:\/\/0.0.0.0/, "://localhost")
    await open(openAddress).catch(console.error)
    logger.info(`Opened ${openAddress}`)
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
  console.log("code-server", version, commit)
  console.log("")
  console.log(`Usage: code-server [options] [path]`)
  console.log("")
  console.log("Options")
  optionDescriptions().forEach((description) => {
    console.log("", description)
  })
} else if (args.version) {
  if (args.json) {
    console.log({
      codeServer: version,
      commit,
      vscode: require("../../lib/vscode/package.json").version,
    })
  } else {
    console.log(version, commit)
  }
  process.exit(0)
} else if (args["list-extensions"] || args["install-extension"] || args["uninstall-extension"]) {
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
