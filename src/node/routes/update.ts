import { Router } from "express"
import { version } from "../constants"
import { ensureAuthenticated } from "../http"
import { UpdateProvider } from "../update"

export const router = Router()

const provider = new UpdateProvider()

router.get("/check", ensureAuthenticated, async (req, res) => {
  const update = await provider.getUpdate(req.query.force === "true")
  res.json({
    checked: update.checked,
    latest: update.version,
    current: version,
    isLatest: provider.isLatestVersion(update),
  })
})
