import * as cp from "child_process"
import Parcel from "@parcel/core"
import * as path from "path"

type FixMeLater = any

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
  private readonly vscodeSourcePath = path.join(this.rootPath, "lib/vscode")

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
    const bundler = this.createBundler()

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

      Watcher.log("killing bundler")
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
    const bundle = bundler.watch((err: FixMeLater, buildEvent: FixMeLater) => {
      if (err) {
        console.error(err)
        Watcher.log("parcel watcher terminated unexpectedly")
        cleanup(1)
      }

      if (buildEvent.type === "buildEnd") {
        console.log("[parcel] bundled")
      }

      if (buildEvent.type === "buildError") {
        console.error("[parcel]", err)
      }
    })

    vscode.stderr.on("data", (d) => process.stderr.write(d))
    tsc.stderr.on("data", (d) => process.stderr.write(d))
    if (plugin) {
      plugin.stderr.on("data", (d) => process.stderr.write(d))
    }

    // From https://github.com/chalk/ansi-regex
    const pattern = [
      "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
      "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))",
    ].join("|")
    const re = new RegExp(pattern, "g")

    /**
     * Split stdout on newlines and strip ANSI codes.
     */
    const onLine = (proc: cp.ChildProcess, callback: (strippedLine: string, originalLine: string) => void): void => {
      let buffer = ""
      if (!proc.stdout) {
        throw new Error("no stdout")
      }
      proc.stdout.setEncoding("utf8")
      proc.stdout.on("data", (d) => {
        const data = buffer + d
        const split = data.split("\n")
        const last = split.length - 1

        for (let i = 0; i < last; ++i) {
          callback(split[i].replace(re, ""), split[i])
        }

        // The last item will either be an empty string (the data ended with a
        // newline) or a partial line (did not end with a newline) and we must
        // wait to parse it until we get a full line.
        buffer = split[last]
      })
    }

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
          bundle.then(restartServer)
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
        bundle.then(restartServer)
      }
    })

    if (plugin) {
      onLine(plugin, (line, original) => {
        // tsc outputs blank lines; skip them.
        if (line !== "") {
          console.log("[plugin]", original)
        }
        if (line.includes("Watching for file changes")) {
          bundle.then(restartServer)
        }
      })
    }
  }

  private createBundler(out = "dist"): FixMeLater {
    return new (Parcel as FixMeLater)({
      entries: [
        path.join(this.rootPath, "src/browser/register.ts"),
        path.join(this.rootPath, "src/browser/serviceWorker.ts"),
        path.join(this.rootPath, "src/browser/pages/login.ts"),
        path.join(this.rootPath, "src/browser/pages/vscode.ts"),
      ],
      cacheDir: path.join(this.rootPath, ".cache"),
      logLevel: 1,
      defaultConfig: require.resolve("@parcel/config-default"),
      defaultTargetOptions: {
        publicUrl: ".",
        shouldOptimize: !!process.env.MINIFY,
        distDir: path.join(this.rootPath, out),
      },
    })
  }
}

main()
