import { logger } from "@coder/logger"
import compression from "compression"
import express, { Express } from "express"
import { promises as fs } from "fs"
import http from "http"
import * as httpolyglot from "httpolyglot"
import * as util from "../common/util"
import { DefaultedArgs } from "./cli"
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
      if (!resolved) {
        reject(err)
      } else {
        // Promise resolved earlier so this is an unrelated error.
        util.logError(logger, "http server error", err)
      }
    })

    if (args.socket) {
      try {
        await fs.unlink(args.socket)
      } catch (error) {
        if (error.code !== "ENOENT") {
          logger.error(error.message)
        }
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
    throw new Error("server has no address") // NOTE@jsjoeio test this line
  }
  if (typeof addr !== "string") {
    return `http://${addr.address}:${addr.port}`
  }
  return addr // NOTE@jsjoeio test this line
}
