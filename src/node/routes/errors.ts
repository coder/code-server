import { logger } from "@coder/logger"
import express from "express"
import { promises as fs } from "fs"
import path from "path"
import { WebsocketRequest } from "../../../typings/pluginapi"
import { HttpCode } from "../../common/http"
import { rootPath } from "../constants"
import { replaceTemplates } from "../http"
import { escapeHtml, getMediaMime } from "../util"

interface ErrorWithStatusCode {
  statusCode: number
}

interface ErrorWithCode {
  code: string
}

/** Error is network related. */
export const errorHasStatusCode = (error: any): error is ErrorWithStatusCode => {
  return error && "statusCode" in error
}

/** Error originates from file system. */
export const errorHasCode = (error: any): error is ErrorWithCode => {
  return error && "code" in error
}

const notFoundCodes = [404, "ENOENT", "EISDIR"]

export const errorHandler: express.ErrorRequestHandler = async (err, req, res, next) => {
  let statusCode = 500

  if (errorHasStatusCode(err)) {
    statusCode = err.statusCode
  } else if (errorHasCode(err) && notFoundCodes.includes(err.code)) {
    statusCode = HttpCode.NotFound
  }

  res.status(statusCode)

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
        .replace(/{{ERROR_TITLE}}/g, statusCode.toString())
        .replace(/{{ERROR_HEADER}}/g, statusCode.toString())
        .replace(/{{ERROR_BODY}}/g, escapeHtml(err.message)),
    )
  } else {
    res.json({
      error: err.message,
      ...(err.details || {}),
    })
  }
}

export const wsErrorHandler: express.ErrorRequestHandler = async (err, req, res, next) => {
  let statusCode = 500
  if (errorHasStatusCode(err)) {
    statusCode = err.statusCode
  } else if (errorHasCode(err) && notFoundCodes.includes(err.code)) {
    statusCode = HttpCode.NotFound
  }
  if (statusCode >= 500) {
    logger.error(`${err.message} ${err.stack}`)
  } else {
    logger.debug(`${err.message} ${err.stack}`)
  }
  ;(req as WebsocketRequest).ws.end(`HTTP/1.1 ${statusCode} ${err.message}\r\n\r\n`)
}
