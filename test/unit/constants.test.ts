import { loggerModule } from "../utils/helpers"

// jest.mock is hoisted above the imports so we must use `require` here.
jest.mock("@coder/logger", () => require("../utils/helpers").loggerModule)

describe("constants", () => {
  beforeAll(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })
  describe("with package.json defined", () => {
    const { getPackageJson } = require("../../src/node/constants")
    let mockPackageJson = {
      name: "mock-code-server",
      description: "Run VS Code on a remote server.",
      repository: "https://github.com/cdr/code-server",
      version: "1.0.0",
      commit: "f6b2be2838f4afb217c2fd8f03eafedd8d55ef9b",
    }
    let version = ""
    let commit = ""

    beforeEach(() => {
      jest.mock("../../package.json", () => mockPackageJson, { virtual: true })
      commit = require("../../src/node/constants").commit
      version = require("../../src/node/constants").version
    })

    afterAll(() => {
      jest.clearAllMocks()
      jest.resetModules()
    })

    it("should provide the commit", () => {
      expect(commit).toBe("f6b2be2838f4afb217c2fd8f03eafedd8d55ef9b")
    })

    it("should return the package.json version", () => {
      expect(version).toBe(mockPackageJson.version)
    })

    describe("getPackageJson", () => {
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
        expect(packageJson.name).toBe("mock-code-server")
        expect(packageJson.description).toBe("Run VS Code on a remote server.")
        expect(packageJson.repository).toBe("https://github.com/cdr/code-server")
      })
    })
  })

  describe("with incomplete package.json", () => {
    let mockPackageJson = {
      name: "mock-code-server",
    }
    let version = ""
    let commit = ""

    beforeEach(() => {
      jest.mock("../../package.json", () => mockPackageJson, { virtual: true })
      version = require("../../src/node/constants").version
      commit = require("../../src/node/constants").commit
    })

    afterEach(() => {
      jest.clearAllMocks()
      jest.resetModules()
    })

    it("version should return 'development'", () => {
      expect(version).toBe("development")
    })
    it("commit should return 'development'", () => {
      expect(commit).toBe("development")
    })
  })
})
