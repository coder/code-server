import { logger } from "@coder/logger"
import compression from "compression"
import express, { Express } from "express"
import { promises as fs } from "fs"
import http from "http"
import * as httpolyglot from "httpolyglot"
import * as util from "../common/util"
import { DefaultedArgs } from "./cli"
import { isNodeJSErrnoException } from "./util"
import { handleUpgrade } from "./wsRouter"

/**
 * Create an Express app and an HTTP/S server to serve it.
 */
export const createApp = async (args: DefaultedArgs): Promise<[Express, Express, http.Server]> => {
  const app = express()

  app.use(compression())

  const server = args.cert
    ? httpolyglot.createServer(
        {
          cert: args.cert && (await fs.readFile(args.cert.value)),
          key: args["cert-key"] && (await fs.readFile(args["cert-key"])),
        },
        app,
      )
    : http.createServer(app)

  let resolved = false
  await new Promise<void>(async (resolve2, reject) => {
    const resolve = () => {
      resolved = true
      resolve2()
    }
    server.on("error", (err) => {
      handleServerError(resolved, err, reject)
    })

    if (args.socket) {
      try {
        await fs.unlink(args.socket)
      } catch (error: any) {
        handleArgsSocketCatchError(error)
      }
      server.listen(args.socket, resolve)
    } else {
      // [] is the correct format when using :: but Node errors with them.
      server.listen(args.port, args.host.replace(/^\[|\]$/g, ""), resolve)
    }
  })

  const wsApp = express()
  handleUpgrade(wsApp, server)

  return [app, wsApp, server]
}

/**
 * Get the address of a server as a string (protocol *is* included) while
 * ensuring there is one (will throw if there isn't).
 */
export const ensureAddress = (server: http.Server): string => {
  const addr = server.address()
  if (!addr) {
    throw new Error("server has no address")
  }
  if (typeof addr !== "string") {
    return `http://${addr.address}:${addr.port}`
  }
  return addr
}

/**
 * Handles error events from the server.
 *
 * If the outlying Promise didn't resolve
 * then we reject with the error.
 *
 * Otherwise, we log the error.
 *
 * We extracted into a function so that we could
 * test this logic more easily.
 */
export const handleServerError = (resolved: boolean, err: Error, reject: (err: Error) => void) => {
  // Promise didn't resolve earlier so this means it's an error
  // that occurs before the server can successfully listen.
  // Possibly triggered by listening on an invalid port or socket.
  if (!resolved) {
    reject(err)
  } else {
    // Promise resolved earlier so this is an unrelated error.
    util.logError(logger, "http server error", err)
  }
}

/**
 * Handles the error that occurs in the catch block
 * after we try fs.unlink(args.socket).
 *
 * We extracted into a function so that we could
 * test this logic more easily.
 */
export const handleArgsSocketCatchError = (error: any) => {
  if (!isNodeJSErrnoException(error) || error.code !== "ENOENT") {
    logger.error(error.message ? error.message : error)
  }
}
