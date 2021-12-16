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
