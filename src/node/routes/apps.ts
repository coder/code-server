import * as express from "express"
import { PluginAPI } from "../plugin"

export function router(papi: PluginAPI): express.Router {
  const router = express.Router()

  router.get("/", async (req, res) => {
    res.json(await papi.applications())
  })
  
  return router
}
