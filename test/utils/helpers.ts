import * as fs from "fs"
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
 * Create a uniquely named temporary directory.
 *
 * These directories are placed under a single temporary code-server directory.
 */
export async function tmpdir(testName: string): Promise<string> {
  const dir = path.join(os.tmpdir(), "code-server/tests")
  await fs.promises.mkdir(dir, { recursive: true })

  return await fs.promises.mkdtemp(path.join(dir, `${testName}-`), { encoding: "utf8" })
}
