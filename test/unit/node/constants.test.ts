import { logger } from "@coder/logger"
import path from "path"
import * as semver from "semver"
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

    const mockCodePackageJson = {
      name: "mock-vscode",
      version: "1.2.3",
    }

    beforeAll(() => {
      jest.clearAllMocks()
      mockLogger()
      jest.mock(path.resolve(__dirname, "../../../package.json"), () => mockPackageJson, { virtual: true })
      jest.mock(path.resolve(__dirname, "../../../lib/vscode/package.json"), () => mockCodePackageJson, {
        virtual: true,
      })
      constants = require("../../../src/node/constants")
    })

    afterAll(() => {
      jest.resetModules()
    })

    it("should provide the commit", () => {
      expect(constants.commit).toBe(mockPackageJson.commit)
    })

    it("should return the package.json version", () => {
      expect(constants.version).toBe(mockPackageJson.version)

      // Ensure the version is parseable as semver and equal
      const actual = semver.parse(constants.version)
      const expected = semver.parse(mockPackageJson.version)
      expect(actual).toBeTruthy()
      expect(actual).toStrictEqual(expected)
    })

    it("should include embedded Code version information", () => {
      expect(constants.codeVersion).toBe(mockCodePackageJson.version)

      // Ensure the version is parseable as semver and equal
      const actual = semver.parse(constants.codeVersion)
      const expected = semver.parse(mockCodePackageJson.version)
      expect(actual).toBeTruthy()
      expect(actual).toStrictEqual(expected)
    })

    it("should return a human-readable version string", () => {
      expect(constants.getVersionString()).toStrictEqual(
        `${mockPackageJson.version} ${mockPackageJson.commit} with Code ${mockCodePackageJson.version}`,
      )
    })

    it("should return a machine-readable version string", () => {
      expect(constants.getVersionJsonString()).toStrictEqual(
        JSON.stringify({
          codeServer: mockPackageJson.version,
          commit: mockPackageJson.commit,
          vscode: mockCodePackageJson.version,
        }),
      )
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

        const codePackageJson = constants.getPackageJson("../../lib/vscode/package.json")
        expect(codePackageJson).toStrictEqual(mockCodePackageJson)
      })
    })
  })

  describe("with incomplete package.json", () => {
    const mockPackageJson = {
      name: "mock-code-server",
    }
    const mockCodePackageJson = {
      name: "mock-vscode",
    }

    beforeAll(() => {
      jest.clearAllMocks()
      jest.mock(path.resolve(__dirname, "../../../package.json"), () => mockPackageJson, { virtual: true })
      jest.mock(path.resolve(__dirname, "../../../lib/vscode/package.json"), () => mockCodePackageJson, {
        virtual: true,
      })
      constants = require("../../../src/node/constants")
    })

    afterAll(() => {
      jest.resetModules()
    })

    it("version should return 'development'", () => {
      expect(constants.version).toBe("development")
    })

    it("commit should return 'development'", () => {
      expect(constants.commit).toBe("development")
    })

    it("should return a human-readable version string", () => {
      // this string is not super useful
      expect(constants.getVersionString()).toStrictEqual("development development with Code development")
    })

    it("should return a machine-readable version string", () => {
      expect(constants.getVersionJsonString()).toStrictEqual(
        JSON.stringify({
          codeServer: "development",
          commit: "development",
          vscode: "development",
        }),
      )
    })
  })
})
