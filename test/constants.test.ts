import { commit, getPackageJson, version } from "../src/node/constants"
import { loggerModule } from "./helpers"

// jest.mock is hoisted above the imports so we must use `require` here.
jest.mock("@coder/logger", () => require("./helpers").loggerModule)

describe("constants", () => {
  describe("getPackageJson", () => {
    afterEach(() => {
      jest.clearAllMocks()
    })

    afterAll(() => {
      jest.restoreAllMocks()
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
    it("should return the package.json version", () => {
      // Source: https://gist.github.com/jhorsman/62eeea161a13b80e39f5249281e17c39#gistcomment-2896416
      const validSemVar = new RegExp("^(0|[1-9]d*).(0|[1-9]d*).(0|[1-9]d*)")
      const isValidSemVar = validSemVar.test(version)
      expect(version).not.toBe(null)
      expect(isValidSemVar).toBe(true)
    })
  })

  describe("commit", () => {
    it("should return 'development' if commit is undefined", () => {
      // In development, the commit is not stored in our package.json
      // But when we build code-server and release it, it is
      expect(commit).toBe("development")
    })
  })
})
