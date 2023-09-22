import { logger } from "@coder/logger"
import { promises as fs } from "fs"
import * as net from "net"
import * as os from "os"
import * as path from "path"
import { CodeServer, CodeServerPage } from "../e2e/models/CodeServer"
import { REVERSE_PROXY_PORT, REVERSE_PROXY_BASE_PATH } from "./constants"

/**
 * Spy on the logger and console and replace with mock implementations to
 * suppress the output.
 */
export function mockLogger() {
  jest.spyOn(logger, "debug").mockImplementation()
  jest.spyOn(logger, "error").mockImplementation()
  jest.spyOn(logger, "info").mockImplementation()
  jest.spyOn(logger, "trace").mockImplementation()
  jest.spyOn(logger, "warn").mockImplementation()

  jest.spyOn(console, "log").mockImplementation()
  jest.spyOn(console, "debug").mockImplementation()
  jest.spyOn(console, "error").mockImplementation()
  jest.spyOn(console, "info").mockImplementation()
  jest.spyOn(console, "trace").mockImplementation()
  jest.spyOn(console, "warn").mockImplementation()
}

/**
 * Clean up directories left by a test. It is recommended to do this when a test
 * starts to avoid potentially accumulating infinite test directories.
 */
export async function clean(testName: string): Promise<void> {
  const dir = path.join(os.tmpdir(), `code-server/tests/${testName}`)
  await fs.rm(dir, { force: true, recursive: true })
}

/**
 * Create a uniquely named temporary directory for a test.
 *
 * `tmpdir` should usually be preceeded by at least one call to `clean`.
 */
export async function tmpdir(testName: string): Promise<string> {
  const dir = path.join(os.tmpdir(), `code-server/tests/${testName}`)
  await fs.mkdir(dir, { recursive: true })

  return await fs.mkdtemp(path.join(dir, `${testName}-`), { encoding: "utf8" })
}

/**
 * @description Helper function to use an environment variable.
 *
 * @returns an array (similar to useState in React) with a function
 * to set the value and reset the value
 */
export function useEnv(key: string): [(nextValue: string | undefined) => string | undefined, () => void] {
  const initialValue = process.env[key]
  const setValue = (nextValue: string | undefined) => (process.env[key] = nextValue)
  // Node automatically converts undefined to string 'undefined'
  // when assigning an environment variable.
  // which is why we need to delete it if it's supposed to be undefined
  // Source: https://stackoverflow.com/a/60147167
  const resetValue = () => {
    if (initialValue !== undefined) {
      process.env[key] = initialValue
    } else {
      delete process.env[key]
    }
  }

  return [setValue, resetValue]
}

/**
 * Helper function to get a random port.
 *
 * Source: https://github.com/sindresorhus/get-port/blob/main/index.js#L23-L33
 */
export const getAvailablePort = (options?: net.ListenOptions): Promise<number> =>
  new Promise((resolve, reject) => {
    const server = net.createServer()
    server.unref()
    server.on("error", reject)
    server.listen(options, () => {
      // NOTE@jsjoeio: not a huge fan of the type assertion
      // but it works for now.
      const { port } = server.address() as net.AddressInfo
      server.close(() => {
        resolve(port)
      })
    })
  })

/**
 * Return a timer that will not reject as long as it is disposed or continually
 * reset before the delay elapses.
 */
export function idleTimer(message: string, reject: (error: Error) => void, delay = 5000) {
  const start = () => setTimeout(() => reject(new Error(message)), delay)
  let timeout = start()
  return {
    reset: () => {
      clearTimeout(timeout)
      timeout = start()
    },
    dispose: () => {
      clearTimeout(timeout)
    },
  }
}

/**
 * If using a proxy, return the address of the proxy.
 *
 * Otherwise, return the direct address of code-server.
 */
export async function getMaybeProxiedCodeServer(codeServer: CodeServerPage | CodeServer): Promise<string> {
  const address = await codeServer.address()
  if (process.env.USE_PROXY === "1") {
    const uri = new URL(address)
    return `http://${uri.hostname}:${REVERSE_PROXY_PORT}/${uri.port}/${REVERSE_PROXY_BASE_PATH}/`
  }

  return address
}

/**
 * Stripes proxy base from url.pathname
 * i.e. /<port>/ide + route returns just route
 */
export function getMaybeProxiedPathname(url: URL): string {
  if (process.env.USE_PROXY === "1") {
    // Behind proxy, path will be /<port>/ide + route
    const pathWithoutProxy = url.pathname.split(`/${REVERSE_PROXY_BASE_PATH}`)[1]
    return pathWithoutProxy
  }

  return url.pathname
}

interface FakeVscodeSockets {
  /* If called, closes all servers after the first connection. */
  once(): FakeVscodeSockets

  /* Manually close all servers. */
  close(): Promise<void>
}

/**
 * Creates servers for each socketPath specified.
 */
export function listenOn(...socketPaths: string[]): FakeVscodeSockets {
  let once = false
  const servers = socketPaths.map((socketPath) => {
    const server = net.createServer(() => {
      if (once) {
        close()
      }
    })
    server.listen(socketPath)
    return server
  })

  async function close() {
    await Promise.all(
      servers.map(
        (server) =>
          new Promise<void>((resolve, reject) => {
            server.close((err) => {
              if (err) {
                reject(err)
                return
              }
              resolve()
            })
          }),
      ),
    )
  }
  const fakeVscodeSockets = {
    close,
    once: () => {
      once = true
      return fakeVscodeSockets
    },
  }
  return fakeVscodeSockets
}
