import { Router } from "express"

export const router = Router()

router.get("/", (req, res) => {
  res.json({
    status: req.heart.alive() ? "alive" : "expired",
    lastHeartbeat: req.heart.lastHeartbeat,
  })
})
