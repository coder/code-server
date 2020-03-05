import * as cp from "child_process"
import * as fs from "fs-extra"
import Bundler from "parcel-bundler"
import * as path from "path"
import * as util from "util"

enum Task {
  Build = "build",
  Watch = "watch",
}

class Builder {
  private readonly rootPath = path.resolve(__dirname, "..")
  private readonly vscodeSourcePath = path.join(this.rootPath, "lib/vscode")
  private readonly buildPath = path.join(this.rootPath, "build")
  private readonly codeServerVersion: string
  private currentTask?: Task

  public constructor() {
    this.ensureArgument("rootPath", this.rootPath)
    this.codeServerVersion = this.ensureArgument(
      "codeServerVersion",
      process.env.VERSION || require(path.join(this.rootPath, "package.json")).version,
    )
  }

  public run(task: Task | undefined): void {
    this.currentTask = task
    this.doRun(task).catch((error) => {
      console.error(error.message)
      process.exit(1)
    })
  }

  private async task<T>(message: string, fn: () => Promise<T>): Promise<T> {
    const time = Date.now()
    this.log(`${message}...`, !process.env.CI)
    try {
      const t = await fn()
      process.stdout.write(`took ${Date.now() - time}ms\n`)
      return t
    } catch (error) {
      process.stdout.write("failed\n")
      throw error
    }
  }

  /**
   * Writes to stdout with an optional newline.
   */
  private log(message: string, skipNewline = false): void {
    process.stdout.write(`[${this.currentTask || "default"}] ${message}`)
    if (!skipNewline) {
      process.stdout.write("\n")
    }
  }

  private async doRun(task: Task | undefined): Promise<void> {
    if (!task) {
      throw new Error("No task provided")
    }

    switch (task) {
      case Task.Watch:
        return this.watch()
      case Task.Build:
        return this.build()
      default:
        throw new Error(`No task matching "${task}"`)
    }
  }

  /**
   * Make sure the argument is set. Display the value if it is.
   */
  private ensureArgument(name: string, arg?: string): string {
    if (!arg) {
      throw new Error(`${name} is missing`)
    }
    this.log(`${name} is "${arg}"`)
    return arg
  }

  /**
   * Build VS Code and code-server.
   */
  private async build(): Promise<void> {
    process.env.NODE_OPTIONS = "--max-old-space-size=32384 " + (process.env.NODE_OPTIONS || "")
    process.env.NODE_ENV = "production"

    await this.task("cleaning up old build", async () => {
      if (!process.env.SKIP_VSCODE) {
        return fs.remove(this.buildPath)
      }
      // If skipping VS Code, keep the existing build if any.
      try {
        const files = await fs.readdir(this.buildPath)
        return Promise.all(files.filter((f) => f !== "lib").map((f) => fs.remove(path.join(this.buildPath, f))))
      } catch (error) {
        if (error.code !== "ENOENT") {
          throw error
        }
      }
    })

    const commit = require(path.join(this.vscodeSourcePath, "build/lib/util")).getVersion(this.rootPath) as string
    if (!process.env.SKIP_VSCODE) {
      await this.buildVscode(commit)
    } else {
      this.log("skipping vs code build")
    }
    await this.buildCodeServer(commit)

    this.log(`final build: ${this.buildPath}`)
  }

  private async buildCodeServer(commit: string): Promise<void> {
    await this.task("building code-server", async () => {
      return util.promisify(cp.exec)("tsc --outDir ./out-build --tsBuildInfoFile ./.prod.tsbuildinfo", {
        cwd: this.rootPath,
      })
    })

    await this.task("bundling code-server", async () => {
      return this.createBundler("dist-build", commit).bundle()
    })

    await this.task("copying code-server into build directory", async () => {
      await fs.mkdirp(this.buildPath)
      await Promise.all([
        fs.copy(path.join(this.rootPath, "out-build"), path.join(this.buildPath, "out")),
        fs.copy(path.join(this.rootPath, "dist-build"), path.join(this.buildPath, "dist")),
        // For source maps and images.
        fs.copy(path.join(this.rootPath, "src"), path.join(this.buildPath, "src")),
      ])
    })

    await this.copyDependencies("code-server", this.rootPath, this.buildPath, {
      commit,
      version: this.codeServerVersion,
    })
  }

  private async buildVscode(commit: string): Promise<void> {
    await this.task("building vs code", () => {
      return util.promisify(cp.exec)("yarn gulp compile-build", { cwd: this.vscodeSourcePath })
    })

    await this.task("building builtin extensions", async () => {
      const exists = await fs.pathExists(path.join(this.vscodeSourcePath, ".build/extensions"))
      if (exists && !process.env.CI) {
        process.stdout.write("already built, skipping...")
      } else {
        await util.promisify(cp.exec)("yarn gulp compile-extensions-build", { cwd: this.vscodeSourcePath })
      }
    })

    await this.task("optimizing vs code", async () => {
      return util.promisify(cp.exec)("yarn gulp optimize --gulpfile ./coder.js", { cwd: this.vscodeSourcePath })
    })

    if (process.env.MINIFY) {
      await this.task("minifying vs code", () => {
        return util.promisify(cp.exec)("yarn gulp minify --gulpfile ./coder.js", { cwd: this.vscodeSourcePath })
      })
    }

    const vscodeBuildPath = path.join(this.buildPath, "lib/vscode")
    await this.task("copying vs code into build directory", async () => {
      await fs.mkdirp(path.join(vscodeBuildPath, "resources/linux"))
      await Promise.all([
        fs.move(
          path.join(this.vscodeSourcePath, `out-vscode${process.env.MINIFY ? "-min" : ""}`),
          path.join(vscodeBuildPath, "out"),
        ),
        fs.copy(path.join(this.vscodeSourcePath, ".build/extensions"), path.join(vscodeBuildPath, "extensions")),
        fs.copy(
          path.join(this.vscodeSourcePath, "resources/linux/code.png"),
          path.join(vscodeBuildPath, "resources/linux/code.png"),
        ),
      ])
    })

    await this.copyDependencies("vs code", this.vscodeSourcePath, vscodeBuildPath, {
      commit,
      date: new Date().toISOString(),
    })
  }

  private async copyDependencies(name: string, sourcePath: string, buildPath: string, merge: object): Promise<void> {
    await this.task(`copying ${name} dependencies`, async () => {
      return Promise.all(
        ["node_modules", "package.json", "yarn.lock"].map((fileName) => {
          return fs.copy(path.join(sourcePath, fileName), path.join(buildPath, fileName))
        }),
      )
    })

    const fileName = name === "code-server" ? "package" : "product"
    await this.task(`writing final ${name} ${fileName}.json`, async () => {
      const json = JSON.parse(await fs.readFile(path.join(sourcePath, `${fileName}.json`), "utf8"))
      return fs.writeFile(
        path.join(buildPath, `${fileName}.json`),
        JSON.stringify(
          {
            ...json,
            ...merge,
          },
          null,
          2,
        ),
      )
    })

    if (process.env.MINIFY) {
      await this.task(`restricting ${name} to production dependencies`, async () => {
        await util.promisify(cp.exec)("yarn --production --ignore-scripts", { cwd: buildPath })
      })
    }
  }

  private async watch(): Promise<void> {
    let server: cp.ChildProcess | undefined
    const restartServer = (): void => {
      if (server) {
        server.kill()
      }
      const s = cp.fork(path.join(this.rootPath, "out/node/entry.js"), process.argv.slice(3))
      console.log(`[server] spawned process ${s.pid}`)
      s.on("exit", () => console.log(`[server] process ${s.pid} exited`))
      server = s
    }

    const vscode = cp.spawn("yarn", ["watch"], { cwd: this.vscodeSourcePath })
    const tsc = cp.spawn("tsc", ["--watch", "--pretty", "--preserveWatchOutput"], { cwd: this.rootPath })
    const bundler = this.createBundler()

    const cleanup = (code?: number | null): void => {
      this.log("killing vs code watcher")
      vscode.removeAllListeners()
      vscode.kill()

      this.log("killing tsc")
      tsc.removeAllListeners()
      tsc.kill()

      if (server) {
        this.log("killing server")
        server.removeAllListeners()
        server.kill()
      }

      this.log("killing bundler")
      process.exit(code || 0)
    }

    process.on("SIGINT", () => cleanup())
    process.on("SIGTERM", () => cleanup())

    vscode.on("exit", (code) => {
      this.log("vs code watcher terminated unexpectedly")
      cleanup(code)
    })
    tsc.on("exit", (code) => {
      this.log("tsc terminated unexpectedly")
      cleanup(code)
    })
    const bundle = bundler.bundle().catch(() => {
      this.log("parcel watcher terminated unexpectedly")
      cleanup(1)
    })
    bundler.on("buildEnd", () => {
      console.log("[parcel] bundled")
    })
    bundler.on("buildError", (error) => {
      console.error("[parcel]", error)
    })

    vscode.stderr.on("data", (d) => process.stderr.write(d))
    tsc.stderr.on("data", (d) => process.stderr.write(d))

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
  }

  private createBundler(out = "dist", commit?: string): Bundler {
    return new Bundler(
      [
        path.join(this.rootPath, "src/browser/pages/app.ts"),
        path.join(this.rootPath, "src/browser/register.ts"),
        path.join(this.rootPath, "src/browser/serviceWorker.ts"),
      ],
      {
        cache: true,
        cacheDir: path.join(this.rootPath, ".cache"),
        detailedReport: true,
        minify: !!process.env.MINIFY,
        hmr: false,
        logLevel: 1,
        outDir: path.join(this.rootPath, out),
        publicUrl: `/static/${commit || "development"}/dist`,
        target: "browser",
      },
    )
  }
}

const builder = new Builder()
builder.run(process.argv[2] as Task)
