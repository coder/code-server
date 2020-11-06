import * as express from "express"
import * as fspath from "path"
import * as pluginapi from "../../../typings/pluginapi"

export const plugin: pluginapi.Plugin = {
  displayName: "Test Plugin",
  routerPath: "/test-plugin",
  homepageURL: "https://example.com",
  description: "Plugin used in code-server tests.",

  init(config) {
    config.logger.debug("test-plugin loaded!")
  },

  router() {
    const r = express.Router()
    r.get("/test-app", (req, res) => {
      res.sendFile(fspath.resolve(__dirname, "../public/index.html"))
    })
    r.get("/goland/icon.svg", (req, res) => {
      res.sendFile(fspath.resolve(__dirname, "../public/icon.svg"))
    })
    return r
  },

  applications() {
    return [
      {
        name: "Test App",
        version: "4.0.0",
        iconPath: "/icon.svg",
        path: "/test-app",

        description: "This app does XYZ.",
        homepageURL: "https://example.com",
      },
    ]
  },
}
