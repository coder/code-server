import { logger } from "@coder/logger"
import * as assert from "assert"
import { describe } from "mocha"
import * as path from "path"
import { PluginAPI } from "../src/node/plugin"

/**
 * Use $LOG_LEVEL=debug to see debug logs.
 */
describe("plugin", () => {
  it("loads", async () => {
    const papi = new PluginAPI(logger, path.resolve(__dirname, "test-plugin") + ":meow")
    await papi.loadPlugins()

    // We remove the function fields from the application's plugins.
    const apps = JSON.parse(JSON.stringify(await papi.applications()))

    assert.deepEqual(
      [
        {
          name: "goland",
          version: "4.0.0",
          iconPath: "icon.svg",
          plugin: {
            name: "test-plugin",
            version: "1.0.0",
            description: "Fake plugin for testing code-server's plugin API",
          },
        },
      ],
      apps,
    )
  })
})
