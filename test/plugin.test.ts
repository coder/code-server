import { logger } from "@coder/logger"
import * as express from "express"
import * as fs from "fs"
import { describe } from "mocha"
import * as path from "path"
import * as supertest from "supertest"
import * as plugin from "../src/node/plugin"
import * as apps from "../src/node/routes/apps"
const fsp = fs.promises

/**
 * Use $LOG_LEVEL=debug to see debug logs.
 */
describe("plugin", () => {
  let papi: plugin.PluginAPI
  let app: express.Application
  let agent: supertest.SuperAgentTest

  before(async () => {
    papi = new plugin.PluginAPI(logger, path.resolve(__dirname, "test-plugin") + ":meow")
    await papi.loadPlugins()

    app = express.default()
    papi.mount(app)

    app.use("/api/applications", apps.router(papi))

    agent = supertest.agent(app)
  })

  it("/api/applications", async () => {
    await agent.get("/api/applications").expect(200, [
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
    let indexHTML = await fsp.readFile(path.join(__dirname, "test-plugin/public/index.html"), {
      encoding: "utf8",
    })
    indexHTML = plugin.injectOverlayHTML(indexHTML)
    await agent.get("/test-plugin/test-app").expect(200, indexHTML)
  })
})
