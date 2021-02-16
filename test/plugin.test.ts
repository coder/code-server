import { logger } from "@coder/logger"
import * as express from "express"
import * as fs from "fs"
import * as path from "path"
import { PluginAPI } from "../src/node/plugin"
import * as apps from "../src/node/routes/apps"
import * as httpserver from "./httpserver"
const fsp = fs.promises

/**
 * Use $LOG_LEVEL=debug to see debug logs.
 */
describe("plugin", () => {
  let papi: PluginAPI
  let s: httpserver.HttpServer

  beforeAll(async () => {
    papi = new PluginAPI(logger, `${path.resolve(__dirname, "test-plugin")}:meow`)
    await papi.loadPlugins()

    const app = express.default()
    papi.mount(app)
    app.use("/api/applications", apps.router(papi))

    s = new httpserver.HttpServer()
    await s.listen(app)
  })

  afterAll(async () => {
    await s.close()
  })

  it("/api/applications", async () => {
    const resp = await s.fetch("/api/applications")
    expect(resp.status).toBe(200)
    const body = await resp.json()
    logger.debug(`${JSON.stringify(body)}`)
    expect(body).toStrictEqual([
      {
        name: "Test App",
        version: "4.0.0",

        description: "This app does XYZ.",
        iconPath: "/test-plugin/test-app/icon.svg",
        homepageURL: "https://example.com",
        path: "/test-plugin/test-app",

        plugin: {
          name: "test-plugin",
          version: "1.0.0",
          modulePath: path.join(__dirname, "test-plugin"),

          displayName: "Test Plugin",
          description: "Plugin used in code-server tests.",
          routerPath: "/test-plugin",
          homepageURL: "https://example.com",
        },
      },
    ])
  })

  it("/test-plugin/test-app", async () => {
    const indexHTML = await fsp.readFile(path.join(__dirname, "test-plugin/public/index.html"), {
      encoding: "utf8",
    })
    const resp = await s.fetch("/test-plugin/test-app")
    expect(resp.status).toBe(200)
    const body = await resp.text()
    expect(body).toBe(indexHTML)
  })
})
