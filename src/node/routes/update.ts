import { Router } from "express"
import { version } from "../constants"
import { ensureAuthenticated } from "../http"
import { UpdateProvider } from "../update"

export const router = Router()

const provider = new UpdateProvider()

router.use((req, _, next) => {
  ensureAuthenticated(req)
  next()
})

router.get("/", async (_, res) => {
  const update = await provider.getUpdate()
  res.json({
    checked: update.checked,
    latest: update.version,
    current: version,
    isLatest: provider.isLatestVersion(update),
  })
})

// This route will force a check.
router.get("/check", async (_, res) => {
  const update = await provider.getUpdate(true)
  res.json({
    checked: update.checked,
    latest: update.version,
    current: version,
    isLatest: provider.isLatestVersion(update),
  })
})
