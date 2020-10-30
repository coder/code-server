import * as pluginapi from "../../../typings/plugin"
import * as express from "express"
import * as path from "path";

export function init(config: pluginapi.PluginConfig) {
  config.logger.debug("test-plugin loaded!")
}

export function router(): express.Router {
  const r = express.Router()
  r.get("/goland/icon.svg", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../public/icon.svg"))
  })
  return r
}

export function applications(): pluginapi.Application[] {
  return [{
    name: "goland",
    version: "4.0.0",
    iconPath: "icon.svg",
  }]
}
