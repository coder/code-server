import * as express from "express"
import { PluginAPI } from "../plugin"

/**
 * Implements the /api/applications endpoint
 */
export function router(papi: PluginAPI): express.Router {
  const router = express.Router()

  router.get("/", async (req, res) => {
    res.json(await papi.applications())
  })
  
  return router
}
