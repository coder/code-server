import { logger } from "@coder/logger"
import { mockLogger } from "../../utils/helpers"

describe("constants", () => {
  let constants: typeof import("../../../src/node/constants")

  describe("with package.json defined", () => {
    const mockPackageJson = {
      name: "mock-code-server",
      description: "Run VS Code on a remote server.",
      repository: "https://github.com/coder/code-server",
      version: "1.0.0",
      commit: "f6b2be2838f4afb217c2fd8f03eafedd8d55ef9b",
    }

    beforeAll(() => {
      mockLogger()
      jest.mock("../../../package.json", () => mockPackageJson, { virtual: true })
      constants = require("../../../src/node/constants")
    })

    afterAll(() => {
      jest.clearAllMocks()
      jest.resetModules()
    })

    it("should provide the commit", () => {
      expect(constants.commit).toBe(mockPackageJson.commit)
    })

    it("should return the package.json version", () => {
      expect(constants.version).toBe(mockPackageJson.version)
    })

    describe("getPackageJson", () => {
      it("should log a warning if package.json not found", () => {
        const expectedErrorMessage = "Cannot find module './package.json' from 'src/node/constants.ts'"

        constants.getPackageJson("./package.json")

        expect(logger.warn).toHaveBeenCalled()
        expect(logger.warn).toHaveBeenCalledWith(expectedErrorMessage)
      })

      it("should find the package.json", () => {
        // the function calls require from src/node/constants
        // so to get the root package.json we need to use ../../
        const packageJson = constants.getPackageJson("../../package.json")
        expect(packageJson).toStrictEqual(mockPackageJson)
      })
    })
  })

  describe("with incomplete package.json", () => {
    const mockPackageJson = {
      name: "mock-code-server",
    }

    beforeAll(() => {
      jest.mock("../../../package.json", () => mockPackageJson, { virtual: true })
      constants = require("../../../src/node/constants")
    })

    afterAll(() => {
      jest.clearAllMocks()
      jest.resetModules()
    })

    it("version should return 'development'", () => {
      expect(constants.version).toBe("development")
    })
    it("commit should return 'development'", () => {
      expect(constants.commit).toBe("development")
    })
  })
})
