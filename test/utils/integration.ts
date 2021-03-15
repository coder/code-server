import * as express from "express"
import { createApp } from "../../src/node/app"
import { parse, setDefaults, parseConfigFile, DefaultedArgs } from "../../src/node/cli"
import { register } from "../../src/node/routes"
import * as httpserver from "./httpserver"

export async function setup(
  argv: string[],
  configFile?: string,
): Promise<[express.Application, express.Application, httpserver.HttpServer, DefaultedArgs]> {
  argv = ["--bind-addr=localhost:0", ...argv]

  const cliArgs = parse(argv)
  const configArgs = parseConfigFile(configFile || "", "test/integration.ts")
  const args = await setDefaults(cliArgs, configArgs)

  const [app, wsApp, server] = await createApp(args)
  await register(app, wsApp, server, args)

  return [app, wsApp, new httpserver.HttpServer(server), args]
}
