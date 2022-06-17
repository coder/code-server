import { spawn } from "child_process"
import { promises as fs } from "fs"
import * as path from "path"
import { parse, parseConfigFile, setDefaults } from "../../src/node/cli"
import { runCodeServer } from "../../src/node/main"
import { workspaceDir } from "./constants"
import { tmpdir } from "./helpers"
import * as httpserver from "./httpserver"

export async function setup(argv: string[], configFile?: string): Promise<httpserver.HttpServer> {
  // This will be used as the data directory to ensure instances do not bleed
  // into each other.
  const dir = await tmpdir(workspaceDir)

  // VS Code complains if the logs dir is missing which spams the output.
  // TODO: Does that mean we are not creating it when we should be?
  await fs.mkdir(path.join(dir, "logs"))

  const cliArgs = parse([
    `--config=${path.join(dir, "config.yaml")}`,
    `--user-data-dir=${dir}`,
    "--bind-addr=localhost:0",
    "--log=warn",
    ...argv,
  ])
  const configArgs = parseConfigFile(configFile || "", "test/integration.ts")
  const args = await setDefaults(cliArgs, configArgs)

  const server = await runCodeServer(args)

  return new httpserver.HttpServer(server)
}

type RunCodeServerCommandOptions = {
  stderr?: "log"
  stdout?: "log"
  ignoreFail?: boolean
}
interface ErrorWithMoreInfo extends Error {
  stderr: string
  stdout: string
}

type CSCmd =
  | {
      code: number | null
      signal: NodeJS.Signals | null
      stdout: string
      stderr: string
    }
  | ErrorWithMoreInfo

/**
 *
 * A helper function for integration tests to run code-server commands.
 */
export async function runCodeServerCommand(argv: string[], options: RunCodeServerCommandOptions = {}): Promise<CSCmd> {
  const CODE_SERVER_COMMAND = process.env.CODE_SERVER_PATH || "/var/tmp/coder/code-server/bin/code-server"
  // Credit: https://github.com/vercel/next.js/blob/canary/test/lib/next-test-utils.js#L139
  return new Promise((resolve, reject) => {
    console.log(`Running command "${CODE_SERVER_COMMAND} ${argv.join(" ")}"`)
    const instance = spawn(CODE_SERVER_COMMAND, [...argv])
    let mergedStdio = ""

    let stderrOutput = ""
    if (options.stderr) {
      instance.stderr.on("data", function (chunk) {
        mergedStdio += chunk
        stderrOutput += chunk

        if (options.stderr === "log") {
          console.log(chunk.toString())
        }
      })
    } else {
      instance.stderr.on("data", function (chunk) {
        mergedStdio += chunk
      })
    }

    let stdoutOutput = ""
    if (options.stdout) {
      instance.stdout.on("data", function (chunk) {
        mergedStdio += chunk
        stdoutOutput += chunk

        if (options.stdout === "log") {
          console.log(chunk.toString())
        }
      })
    } else {
      instance.stdout.on("data", function (chunk) {
        mergedStdio += chunk
      })
    }

    instance.on("close", (code, signal) => {
      if (!options.stderr && !options.stdout && !options.ignoreFail && code !== 0) {
        return reject(new Error(`command failed with code ${code}\n${mergedStdio}`))
      }

      resolve({
        code,
        signal,
        stdout: stdoutOutput,
        stderr: stderrOutput,
      })
    })

    instance.on("error", (err: ErrorWithMoreInfo) => {
      err.stdout = stdoutOutput
      err.stderr = stderrOutput
      reject(err)
    })
  })
}
