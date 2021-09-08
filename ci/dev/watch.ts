import browserify from "browserify"
import * as cp from "child_process"
import * as fs from "fs"
import * as path from "path"
import { onLine } from "../../src/node/util"

async function main(): Promise<void> {
  try {
    const watcher = new Watcher()
    await watcher.watch()
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}

class Watcher {
  private readonly rootPath = path.resolve(__dirname, "../..")
  private readonly vscodeSourcePath = path.join(this.rootPath, "vendor/modules/code-oss-dev")

  private static log(message: string, skipNewline = false): void {
    process.stdout.write(message)
    if (!skipNewline) {
      process.stdout.write("\n")
    }
  }

  public async watch(): Promise<void> {
    let server: cp.ChildProcess | undefined
    const restartServer = (): void => {
      if (server) {
        server.kill()
      }
      const s = cp.fork(path.join(this.rootPath, "out/node/entry.js"), process.argv.slice(2))
      console.log(`[server] spawned process ${s.pid}`)
      s.on("exit", () => console.log(`[server] process ${s.pid} exited`))
      server = s
    }

    const vscode = cp.spawn("yarn", ["watch"], { cwd: this.vscodeSourcePath })
    const tsc = cp.spawn("tsc", ["--watch", "--pretty", "--preserveWatchOutput"], { cwd: this.rootPath })
    const plugin = process.env.PLUGIN_DIR
      ? cp.spawn("yarn", ["build", "--watch"], { cwd: process.env.PLUGIN_DIR })
      : undefined

    const cleanup = (code?: number | null): void => {
      Watcher.log("killing vs code watcher")
      vscode.removeAllListeners()
      vscode.kill()

      Watcher.log("killing tsc")
      tsc.removeAllListeners()
      tsc.kill()

      if (plugin) {
        Watcher.log("killing plugin")
        plugin.removeAllListeners()
        plugin.kill()
      }

      if (server) {
        Watcher.log("killing server")
        server.removeAllListeners()
        server.kill()
      }

      Watcher.log("killing watch")
      process.exit(code || 0)
    }

    process.on("SIGINT", () => cleanup())
    process.on("SIGTERM", () => cleanup())

    vscode.on("exit", (code) => {
      Watcher.log("vs code watcher terminated unexpectedly")
      cleanup(code)
    })
    tsc.on("exit", (code) => {
      Watcher.log("tsc terminated unexpectedly")
      cleanup(code)
    })
    if (plugin) {
      plugin.on("exit", (code) => {
        Watcher.log("plugin terminated unexpectedly")
        cleanup(code)
      })
    }

    vscode.stderr.on("data", (d) => process.stderr.write(d))
    tsc.stderr.on("data", (d) => process.stderr.write(d))
    if (plugin) {
      plugin.stderr.on("data", (d) => process.stderr.write(d))
    }

    const browserFiles = [
      path.join(this.rootPath, "out/browser/register.js"),
      path.join(this.rootPath, "out/browser/pages/login.js"),
      path.join(this.rootPath, "out/browser/pages/vscode.js"),
    ]

    let startingVscode = false
    let startedVscode = false
    onLine(vscode, (line, original) => {
      console.log("[vscode]", original)
      // Wait for watch-client since "Finished compilation" will appear multiple
      // times before the client starts building.
      if (!startingVscode && line.includes("Starting watch-client")) {
        startingVscode = true
      } else if (startingVscode && line.includes("Finished compilation")) {
        if (startedVscode) {
          restartServer()
        }
        startedVscode = true
      }
    })

    onLine(tsc, (line, original) => {
      // tsc outputs blank lines; skip them.
      if (line !== "") {
        console.log("[tsc]", original)
      }
      if (line.includes("Watching for file changes")) {
        bundleBrowserCode(browserFiles)
        restartServer()
      }
    })

    if (plugin) {
      onLine(plugin, (line, original) => {
        // tsc outputs blank lines; skip them.
        if (line !== "") {
          console.log("[plugin]", original)
        }
        if (line.includes("Watching for file changes")) {
          restartServer()
        }
      })
    }
  }
}

function bundleBrowserCode(inputFiles: string[]) {
  console.log(`[browser] bundling...`)
  inputFiles.forEach(async (path: string) => {
    const outputPath = path.replace(".js", ".browserified.js")
    browserify()
      .add(path)
      .bundle()
      .on("error", function (error: Error) {
        console.error(error.toString())
      })
      .pipe(fs.createWriteStream(outputPath))
  })
  console.log(`[browser] done bundling`)
}

main()
