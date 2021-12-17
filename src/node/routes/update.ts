import { Router } from "express"
import { version } from "../constants"
import { ensureAuthenticated } from "../http"

export const router = Router()

router.get("/check", ensureAuthenticated, async (req, res) => {
  const update = await req.updater.getUpdate(req.query.force === "true")
  res.json({
    checked: update.checked,
    latest: update.version,
    current: version,
    isLatest: req.updater.isLatestVersion(update),
  })
})
