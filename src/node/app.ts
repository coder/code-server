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
import { EditorSessionManager, makeEditorSessionManagerServer } from "./vscodeSocket"
import { handleUpgrade } from "./wsRouter"

type SocketOptions = { socket: string; "socket-mode"?: string }
type ListenOptions = DefaultedArgs | SocketOptions

export interface App extends Disposable {
  /** Handles regular HTTP requests. */
  router: Express
  /** Handles websocket requests. */
  wsRouter: Express
  /** The underlying HTTP server. */
  server: http.Server
  /** Handles requests to the editor session management API. */
  editorSessionManagerServer: http.Server
}

const isSocketOpts = (opts: ListenOptions): opts is SocketOptions => {
  return !!(opts as SocketOptions).socket || !(opts as DefaultedArgs).host
}

export const listen = async (server: http.Server, opts: ListenOptions) => {
  if (isSocketOpts(opts)) {
    try {
      await fs.unlink(opts.socket)
    } catch (error: any) {
      handleArgsSocketCatchError(error)
    }
  }
  await new Promise<void>(async (resolve, reject) => {
    server.on("error", reject)
    const onListen = () => {
      // Promise resolved earlier so this is an unrelated error.
      server.off("error", reject)
      server.on("error", (err) => util.logError(logger, "http server error", err))
      resolve()
    }
    if (isSocketOpts(opts)) {
      server.listen(opts.socket, onListen)
    } else {
      // [] is the correct format when using :: but Node errors with them.
      server.listen(opts.port, opts.host.replace(/^\[|\]$/g, ""), onListen)
    }
  })

  // NOTE@jsjoeio: we need to chmod after the server is finished
  // listening. Otherwise, the socket may not have been created yet.
  if (isSocketOpts(opts)) {
    if (opts["socket-mode"]) {
      await fs.chmod(opts.socket, opts["socket-mode"])
    }
  }
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

  const disposeServer = disposer(server)

  await listen(server, args)

  const wsRouter = express()
  handleUpgrade(wsRouter, server)

  const editorSessionManager = new EditorSessionManager()
  const editorSessionManagerServer = await makeEditorSessionManagerServer(args["session-socket"], editorSessionManager)
  const disposeEditorSessionManagerServer = disposer(editorSessionManagerServer)

  const dispose = async () => {
    await Promise.all([disposeServer(), disposeEditorSessionManagerServer()])
  }

  return { router, wsRouter, server, dispose, editorSessionManagerServer }
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
    const host = addr.family === "IPv6" ? `[${addr.address}]` : addr.address
    return new URL(`${protocol}://${host}:${addr.port}`)
  }

  // If this is a string then it is a pipe or Unix socket.
  return addr
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
    throw Error(error.message ? error.message : error)
  }
}
