import * as express from "express"
import * as fspath from "path"
import * as pluginapi from "../../../typings/pluginapi"

export const displayName = "Test Plugin"
export const routerPath = "/test-plugin"
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
      name: "Test App",
      version: "4.0.0",
      iconPath: "/icon.svg",
      path: "/test-app",

      description: "This app does XYZ.",
    },
  ]
}
