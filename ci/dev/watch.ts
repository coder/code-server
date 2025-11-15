import { spawn, ChildProcess } from "child_process"
import * as path from "path"
import { onLine, OnLineCallback } from "../../src/node/util"

interface DevelopmentCompilers {
  [key: string]: ChildProcess | undefined
  vscode: ChildProcess
  vscodeWebExtensions: ChildProcess
  codeServer: ChildProcess
  plugins: ChildProcess | undefined
}

class Watcher {
  private rootPath = path.resolve(process.cwd())
  private readonly paths = {
    /** Path to uncompiled VS Code source. */
    vscodeDir: path.join(this.rootPath, "lib/vscode"),
    pluginDir: process.env.PLUGIN_DIR,
  }

  //#region Web Server

  /** Development web server. */
  private webServer: ChildProcess | undefined

  private reloadWebServer = (): void => {
    if (this.webServer) {
      this.webServer.kill()
    }

    // Pass CLI args, save for `node` and the initial script name.
    const args = process.argv.slice(2)
    this.webServer = spawn("node", [path.join(this.rootPath, "out/node/entry.js"), ...args])
    onLine(this.webServer, (line) => console.log("[code-server]", line))
    const { pid } = this.webServer

    this.webServer.on("exit", () => console.log("[code-server]", `Web process ${pid} exited`))

    console.log("\n[code-server]", `Spawned web server process ${pid}`)
  }

  //#endregion

  //#region Compilers

  private readonly compilers: DevelopmentCompilers = {
    codeServer: spawn("tsc", ["--watch", "--pretty", "--preserveWatchOutput"], { cwd: this.rootPath }),
    vscode: spawn("npm", ["run", "watch"], { cwd: this.paths.vscodeDir }),
    vscodeWebExtensions: spawn("npm", ["run", "watch-web"], { cwd: this.paths.vscodeDir }),
    plugins: this.paths.pluginDir
      ? spawn("npm", ["run", "build", "--watch"], { cwd: this.paths.pluginDir })
      : undefined,
  }

  public async initialize(): Promise<void> {
    for (const event of ["SIGINT", "SIGTERM"]) {
      process.on(event, () => this.dispose(0))
    }

    for (const [processName, devProcess] of Object.entries(this.compilers)) {
      if (!devProcess) continue

      devProcess.on("exit", (code) => {
        console.log(`[${processName}]`, "Terminated unexpectedly")
        this.dispose(code)
      })

      if (devProcess.stderr) {
        devProcess.stderr.on("data", (d: string | Uint8Array) => process.stderr.write(d))
      }
    }

    onLine(this.compilers.vscode, this.parseVSCodeLine)
    onLine(this.compilers.codeServer, this.parseCodeServerLine)

    if (this.compilers.plugins) {
      onLine(this.compilers.plugins, this.parsePluginLine)
    }
  }

  //#endregion

  //#region Line Parsers

  private parseVSCodeLine: OnLineCallback = (strippedLine, originalLine) => {
    if (!strippedLine.length) return

    console.log("[Code OSS]", originalLine)

    if (strippedLine.includes("Finished compilation with")) {
      console.log("[Code OSS] ✨ Finished compiling! ✨", "(Refresh your web browser ♻️)")
      this.reloadWebServer()
    }
  }

  private parseCodeServerLine: OnLineCallback = (strippedLine, originalLine) => {
    if (!strippedLine.length) return

    console.log("[Compiler][code-server]", originalLine)

    if (strippedLine.includes("Watching for file changes")) {
      console.log("[Compiler][code-server]", "Finished compiling!", "(Refresh your web browser ♻️)")
      this.reloadWebServer()
    }
  }

  private parsePluginLine: OnLineCallback = (strippedLine, originalLine) => {
    if (!strippedLine.length) return

    console.log("[Compiler][Plugin]", originalLine)

    if (strippedLine.includes("Watching for file changes...")) {
      this.reloadWebServer()
    }
  }

  //#endregion

  //#region Utilities

  private dispose(code: number | null): void {
    for (const [processName, devProcess] of Object.entries(this.compilers)) {
      console.log(`[${processName}]`, "Killing...\n")
      devProcess?.removeAllListeners()
      devProcess?.kill()
    }
    process.exit(typeof code === "number" ? code : 0)
  }

  //#endregion
}

async function main(): Promise<void> {
  try {
    const watcher = new Watcher()
    await watcher.initialize()
  } catch (error: any) {
    console.error(error.message)
    process.exit(1)
  }
}

main()
