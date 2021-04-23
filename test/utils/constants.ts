import * as fs from "fs"
import * as os from "os"
import * as path from "path"

export const CODE_SERVER_ADDRESS = process.env.CODE_SERVER_ADDRESS || "http://localhost:8080"
export const PASSWORD = process.env.PASSWORD || "e45432jklfdsab"
export const STORAGE = process.env.STORAGE || ""

export async function tmpdir(testName: string): Promise<string> {
  const dir = path.join(os.tmpdir(), "code-server")
  await fs.promises.mkdir(dir, { recursive: true })

  return await fs.promises.mkdtemp(path.join(dir, `test-${testName}-`), { encoding: "utf8" })
}
