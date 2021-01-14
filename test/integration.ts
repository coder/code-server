import { createApp } from "../src/node/app"
import { register } from "../src/node/routes"
import { parse, setDefaults, parseConfigFile, DefaultedArgs } from  "../src/node/cli"
import * as httpserver from "./httpserver"
import * as express from "express"

export async function setup(argv: string[], configFile?: string): Promise<[express.Application, express.Application, httpserver.HttpServer, DefaultedArgs]> {
  const cliArgs = parse(argv)
  let configArgs = parseConfigFile(configFile || "", "test/integration.ts")
  const args = await setDefaults(cliArgs, configArgs)

  const [app, wsApp, server] = await createApp(args)
  await register(app, wsApp, server, args)

  return [app, wsApp, new httpserver.HttpServer(server), args]
}
