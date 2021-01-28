import { Router } from "express"
import { wss, Router as WsRouter } from "../wsRouter"

export const router = Router()

router.get("/", (req, res) => {
  res.json({
    status: req.heart.alive() ? "alive" : "expired",
    lastHeartbeat: req.heart.lastHeartbeat,
  })
})

export const wsRouter = WsRouter()

wsRouter.ws("/", async (req) => {
  wss.handleUpgrade(req, req.socket, req.head, (ws) => {
    ws.on("message", () => {
      ws.send(
        JSON.stringify({
          event: "health",
          status: req.heart.alive() ? "alive" : "expired",
          lastHeartbeat: req.heart.lastHeartbeat,
        }),
      )
    })
  })
})
