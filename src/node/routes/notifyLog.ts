import { Router, Request, Response } from "express"
import { promises as fs } from "fs"
import * as path from "path"
import { logger } from "@coder/logger"
import { ensureAuthenticated } from "../http"
import { paths } from "../util"

export const router = Router()

// [code-server CMB] Persist suppressed notification popups to a server-side log
// file so they can be audited without ever surfacing to the user (no toast, no
// notification center badge). Triggered from the workbench's NotificationService.
const LOG_FILE = path.join(paths.data, "notification.log")
const MAX_BYTES = 10 * 1024 * 1024

router.post("/", ensureAuthenticated, async (req: Request, res: Response) => {
  try {
    const body = (req.body || {}) as Record<string, unknown>

    const entry = {
      t: new Date().toISOString(),
      severity: typeof body.severity === "string" ? body.severity : null,
      message: typeof body.message === "string" ? body.message.slice(0, 4096) : "",
      source: typeof body.source === "string" ? body.source.slice(0, 256) : undefined,
      sourceId: typeof body.sourceId === "string" ? body.sourceId.slice(0, 256) : undefined,
      priority: typeof body.priority === "number" ? body.priority : undefined,
    }

    let line = JSON.stringify(entry) + "\n"

    // Light rotation: if the log grows past the limit, start a fresh file.
    try {
      const stat = await fs.stat(LOG_FILE)
      if (stat.size > MAX_BYTES) {
        await fs.writeFile(LOG_FILE, line)
        line = ""
      }
    } catch {
      // File does not exist yet; fall through to append below.
    }

    if (line) {
      await fs.appendFile(LOG_FILE, line)
    }

    res.status(204).end()
  } catch (error: any) {
    logger.error(`notify-log: ${error?.message ?? error}`)
    res.status(500).end()
  }
})
