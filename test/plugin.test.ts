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

    const apps = await papi.applications()

    assert.deepEqual(
      [
        {
          name: "test app",
          version: "4.0.0",

          description: "my description",
          iconPath: "/icon.svg",

          plugin: {
            name: "test-plugin",
            version: "1.0.0",
            modulePath: path.join(__dirname, "test-plugin"),

            description: "Plugin used in code-server tests.",
            displayName: "Test Plugin",
            path: "/test-plugin",
          },
        },
      ],
      apps,
    )
  })
})
