import { promises as fs } from "fs"
import { tmpdir } from "../../test/utils/helpers"

/**
 * This file is for testing test helpers (not core code).
 */
describe("test helpers", () => {
  it("should return a temp directory", async () => {
    const testName = "temp-dir"
    const pathToTempDir = await tmpdir(testName)
    expect(pathToTempDir).toContain(testName)
    expect(fs.access(pathToTempDir)).resolves.toStrictEqual(undefined)
  })
})
