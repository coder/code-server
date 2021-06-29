import { promises as fs } from "fs"
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
