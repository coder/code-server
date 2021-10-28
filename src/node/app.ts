import { logger } from "@coder/logger"
import compression from "compression"
import express, { Express } from "express"
import { promises as fs } from "fs"
import http from "http"
import * as httpolyglot from "httpolyglot"
import { Disposable } from "../common/emitter"
import * as util from "../common/util"
import { DefaultedArgs } from "./cli"
import { disposer } from "./http"
import { isNodeJSErrnoException } from "./util"
import { handleUpgrade } from "./wsRouter"

type ListenOptions = Pick<DefaultedArgs, "socket" | "port" | "host">

export interface App extends Disposable {
  /** Handles regular HTTP requests. */
  router: Express
  /** Handles websocket requests. */
  wsRouter: Express
  /** The underlying HTTP server. */
  server: http.Server
}

const listen = (server: http.Server, { host, port, socket }: ListenOptions) => {
  return new Promise<void>(async (resolve, reject) => {
    server.on("error", reject)

    const onListen = () => {
      // Promise resolved earlier so this is an unrelated error.
      server.off("error", reject)
      server.on("error", (err) => util.logError(logger, "http server error", err))

      resolve()
    }

    if (socket) {
      try {
        await fs.unlink(socket)
      } catch (error: any) {
        handleArgsSocketCatchError(error)
      }

      server.listen(socket, onListen)
    } else {
      // [] is the correct format when using :: but Node errors with them.
      server.listen(parseInt(port, 10), host.replace(/^\[|\]$/g, ""), onListen)
    }
  })
}

/**
 * Create an Express app and an HTTP/S server to serve it.
 */
export const createApp = async (args: DefaultedArgs): Promise<App> => {
  const router = express()
  router.use(compression())

  const server = args.cert
    ? httpolyglot.createServer(
        {
          cert: args.cert && (await fs.readFile(args.cert.value)),
          key: args["cert-key"] && (await fs.readFile(args["cert-key"])),
        },
        router,
      )
    : http.createServer(router)

  const dispose = disposer(server)

  await listen(server, args)

  const wsRouter = express()
  handleUpgrade(wsRouter, server)

  return { router, wsRouter, server, dispose }
}

/**
 * Get the address of a server as a string (protocol *is* included) while
 * ensuring there is one (will throw if there isn't).
 *
 * The address might be a URL or it might be a pipe or socket path.
 */
export const ensureAddress = (server: http.Server, protocol: string): URL | string => {
  const addr = server.address()

  if (!addr) {
    throw new Error("Server has no address")
  }

  if (typeof addr !== "string") {
    return new URL(`${protocol}://${addr.address}:${addr.port}`)
  }

  // If this is a string then it is a pipe or Unix socket.
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
