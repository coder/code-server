import { logger } from "@coder/logger"
import { promises as fs } from "fs"
import path from "path"
import { SettingsProvider, CoderSettings } from "../../../src/node/settings"
import { clean, mockLogger, tmpdir } from "../../utils/helpers"

describe("settings", () => {
  const testName = "settingsTests"
  let testDir = ""

  beforeAll(async () => {
    mockLogger()
    await clean(testName)
    testDir = await tmpdir(testName)
  })
  describe("with invalid JSON in settings file", () => {
    const mockSettingsFile = "coder.json"
    let pathToMockSettingsFile = ""

    beforeEach(async () => {
      pathToMockSettingsFile = path.join(testDir, mockSettingsFile)
      // Missing a quote, which makes it invalid intentionally
      await fs.writeFile(pathToMockSettingsFile, '{"fakeKey":true,"helloWorld:"test"}')
    })
    afterEach(async () => {
      jest.clearAllMocks()
    })
    it("should log a warning", async () => {
      const settings = new SettingsProvider<CoderSettings>(pathToMockSettingsFile)
      await settings.read()
      // This happens when we can't parse a JSON (usually error in file)
      expect(logger.warn).toHaveBeenCalledWith(expect.stringMatching(/Unexpected token/))
    })
  })
  describe("with invalid settings file path", () => {
    const mockSettingsFile = "nonExistent.json"
    let pathToMockSettingsFile = ""

    beforeEach(async () => {
      // Add hello so it's a directory that doesn't exist
      // NOTE: if we don't have that, it fails the test
      // That's because it will write a file if it doesn't exist
      // but it throws if there's a directory in the path that
      // doesn't exist.
      pathToMockSettingsFile = path.join(testDir, "hello", mockSettingsFile)
    })
    afterEach(async () => {
      jest.clearAllMocks()
    })
    it("should log a warning", async () => {
      const settings = new SettingsProvider<CoderSettings>(pathToMockSettingsFile)
      await settings.write({
        update: {
          checked: 2,
          version: "4.0.1",
        },
      })
      // This happens if it tries to writeFile to a nonexistent path
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("ENOENT: no such file or directory"))
    })
  })
})
