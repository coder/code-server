import * as fs from "fs"
import { tmpdir } from "../../test/utils/constants"
import { loggerModule } from "../utils/helpers"

// jest.mock is hoisted above the imports so we must use `require` here.
jest.mock("@coder/logger", () => require("../utils/helpers").loggerModule)

describe("constants", () => {
  describe("getPackageJson", () => {
    const { getPackageJson } = require("../../src/node/constants")
    afterEach(() => {
      jest.clearAllMocks()
    })

    afterAll(() => {
      jest.restoreAllMocks()
      jest.resetModules()
    })

    it("should log a warning if package.json not found", () => {
      const expectedErrorMessage = "Cannot find module './package.json' from 'src/node/constants.ts'"

      getPackageJson("./package.json")

      expect(loggerModule.logger.warn).toHaveBeenCalled()
      expect(loggerModule.logger.warn).toHaveBeenCalledWith(expectedErrorMessage)
    })

    it("should find the package.json", () => {
      // the function calls require from src/node/constants
      // so to get the root package.json we need to use ../../
      const packageJson = getPackageJson("../../package.json")
      expect(Object.keys(packageJson).length).toBeGreaterThan(0)
      expect(packageJson.name).toBe("code-server")
      expect(packageJson.description).toBe("Run VS Code on a remote server.")
      expect(packageJson.repository).toBe("https://github.com/cdr/code-server")
    })
  })
  describe("version", () => {
    describe("with package.json.version defined", () => {
      let mockPackageJson = {
        name: "mock-code-server",
        version: "1.0.0",
      }
      let version = ""

      beforeEach(() => {
        jest.mock("../../package.json", () => mockPackageJson, { virtual: true })
        version = require("../../src/node/constants").version
      })

      afterEach(() => {
        jest.resetAllMocks()
        jest.resetModules()
      })

      it("should return the package.json version", () => {
        // Source: https://gist.github.com/jhorsman/62eeea161a13b80e39f5249281e17c39#gistcomment-2896416
        const validSemVar = new RegExp("^(0|[1-9]d*).(0|[1-9]d*).(0|[1-9]d*)")
        const isValidSemVar = validSemVar.test(version)
        expect(version).not.toBe(null)
        expect(isValidSemVar).toBe(true)
        expect(version).toBe("1.0.0")
      })
    })
    describe("with package.json.version missing", () => {
      let mockPackageJson = {
        name: "mock-code-server",
      }
      let version = ""

      beforeEach(() => {
        jest.mock("../../package.json", () => mockPackageJson, { virtual: true })
        version = require("../../src/node/constants").version
      })

      afterEach(() => {
        jest.resetAllMocks()
        jest.resetModules()
      })

      it("should return 'development'", () => {
        expect(version).toBe("development")
      })
    })
  })
  describe("commit", () => {
    describe("with package.json.commit defined", () => {
      let mockPackageJson = {
        name: "mock-code-server",
        commit: "f6b2be2838f4afb217c2fd8f03eafedd8d55ef9b",
      }
      let commit = ""

      beforeEach(() => {
        jest.mock("../../package.json", () => mockPackageJson, { virtual: true })
        commit = require("../../src/node/constants").commit
      })

      afterEach(() => {
        jest.resetAllMocks()
        jest.resetModules()
      })

      it("should return the package.json.commit", () => {
        // Source: https://gist.github.com/jhorsman/62eeea161a13b80e39f5249281e17c39#gistcomment-2896416
        expect(commit).toBe("f6b2be2838f4afb217c2fd8f03eafedd8d55ef9b")
      })
    })
    describe("with package.json.commit missing", () => {
      let mockPackageJson = {
        name: "mock-code-server",
      }
      let commit = ""

      beforeEach(() => {
        jest.mock("../../package.json", () => mockPackageJson, { virtual: true })
        commit = require("../../src/node/constants").commit
      })

      afterEach(() => {
        jest.resetAllMocks()
        jest.resetModules()
      })

      it("should return 'development'", () => {
        expect(commit).toBe("development")
      })
    })
  })
})

describe("test constants", () => {
  describe("tmpdir", () => {
    it("should return a temp directory", async () => {
      const testName = "temp-dir"
      const pathToTempDir = await tmpdir(testName)

      expect(pathToTempDir).toContain(testName)

      await fs.promises.rmdir(pathToTempDir)
    })
  })
})
