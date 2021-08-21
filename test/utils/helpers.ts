import { promises as fs } from "fs"
import * as net from "net"
import * as os from "os"
import * as path from "path"

/**
 * Return a mock of @coder/logger.
 */
export function createLoggerMock() {
  return {
    field: jest.fn(),
    level: 2,
    logger: {
      debug: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      trace: jest.fn(),
      warn: jest.fn(),
    },
  }
}

/**
 * Clean up directories left by a test. It is recommended to do this when a test
 * starts to avoid potentially accumulating infinite test directories.
 */
export async function clean(testName: string): Promise<void> {
  const dir = path.join(os.tmpdir(), `code-server/tests/${testName}`)
  await fs.rmdir(dir, { recursive: true })
}

/**
 * Create a uniquely named temporary directory for a test.
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
