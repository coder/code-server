import * as express from "express"
import * as fspath from "path"
import * as pluginapi from "../../../typings/pluginapi"

export const displayName = "Test Plugin"
export const path = "/test-plugin"
export const description = "Plugin used in code-server tests."

export function init(config: pluginapi.PluginConfig) {
  config.logger.debug("test-plugin loaded!")
}

export function router(): express.Router {
  const r = express.Router()
  r.get("/goland/icon.svg", (req, res) => {
    res.sendFile(fspath.resolve(__dirname, "../public/icon.svg"))
  })
  return r
}

export function applications(): pluginapi.Application[] {
  return [
    {
      name: "test app",
      version: "4.0.0",
      iconPath: "/icon.svg",

      description: "my description",
    },
  ]
}
