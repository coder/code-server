import { logger } from "@coder/logger"
import express, { Express } from "express"
import { promises as fs } from "fs"
import http from "http"
import * as httpolyglot from "httpolyglot"
import { DefaultedArgs } from "./cli"

/**
 * Create an Express app and an HTTP/S server to serve it.
 */
export const createApp = async (args: DefaultedArgs): Promise<[Express, http.Server]> => {
  const app = express()

  const server = args.cert
    ? httpolyglot.createServer(
        {
          cert: args.cert && (await fs.readFile(args.cert.value)),
          key: args["cert-key"] && (await fs.readFile(args["cert-key"])),
        },
        app,
      )
    : http.createServer(app)

  await new Promise<http.Server>(async (resolve, reject) => {
    server.on("error", reject)
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

  return [app, server]
}

/**
 * Get the address of a server as a string (protocol not included) while
 * ensuring there is one (will throw if there isn't).
 */
export const ensureAddress = (server: http.Server): string => {
  const addr = server.address()
  if (!addr) {
    throw new Error("server has no address")
  }
  if (typeof addr !== "string") {
    return `${addr.address}:${addr.port}`
  }
  return addr
}
