import { parse, parseConfigFile, setDefaults } from "../../src/node/cli"
import { runCodeServer } from "../../src/node/main"
import * as httpserver from "./httpserver"

export async function setup(argv: string[], configFile?: string): Promise<httpserver.HttpServer> {
  argv = ["--bind-addr=localhost:0", "--log=warn", ...argv]

  const cliArgs = parse(argv)
  const configArgs = parseConfigFile(configFile || "", "test/integration.ts")
  const args = await setDefaults(cliArgs, configArgs)

  const server = await runCodeServer(args)

  return new httpserver.HttpServer(server)
}
