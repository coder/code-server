import { logger } from "@coder/logger"
import express from "express"
import { promises as fs } from "fs"
import path from "path"
import { WebsocketRequest } from "../../../typings/pluginapi"
import { HttpCode } from "../../common/http"
import { rootPath } from "../constants"
import { replaceTemplates } from "../http"
import { getMediaMime } from "../util"

const notFoundCodes = ["ENOENT", "EISDIR"]
export const errorHandler: express.ErrorRequestHandler = async (err, req, res, next) => {
  if (notFoundCodes.includes(err.code)) {
    err.status = HttpCode.NotFound
  }

  const status = err.status ?? err.statusCode ?? 500
  res.status(status)

  // Assume anything that explicitly accepts text/html is a user browsing a
  // page (as opposed to an xhr request). Don't use `req.accepts()` since
  // *every* request that I've seen (in Firefox and Chromium at least)
  // includes `*/*` making it always truthy. Even for css/javascript.
  if (req.headers.accept && req.headers.accept.includes("text/html")) {
    const resourcePath = path.resolve(rootPath, "src/browser/pages/error.html")
    res.set("Content-Type", getMediaMime(resourcePath))
    const content = await fs.readFile(resourcePath, "utf8")
    res.send(
      replaceTemplates(req, content)
        .replace(/{{ERROR_TITLE}}/g, status)
        .replace(/{{ERROR_HEADER}}/g, status)
        .replace(/{{ERROR_BODY}}/g, err.message),
    )
  } else {
    res.json({
      error: err.message,
      ...(err.details || {}),
    })
  }
}

export const wsErrorHandler: express.ErrorRequestHandler = async (err, req, res, next) => {
  logger.error(`${err.message} ${err.stack}`)
  ;(req as WebsocketRequest).ws.end()
}
