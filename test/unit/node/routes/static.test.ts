import { promises as fs } from "fs"
import * as path from "path"
import { rootPath } from "../../../../src/node/constants"
import { clean, tmpdir } from "../../../utils/helpers"
import * as httpserver from "../../../utils/httpserver"
import * as integration from "../../../utils/integration"

const NOT_FOUND = {
  code: 404,
  message: /not found/i,
}

describe("/_static", () => {
  let _codeServer: httpserver.HttpServer | undefined
  function codeServer(): httpserver.HttpServer {
    if (!_codeServer) {
      throw new Error("tried to use code-server before setting it up")
    }
    return _codeServer
  }

  let testFile: string | undefined
  let testFileContent: string | undefined
  let nonExistentTestFile: string | undefined

  const testName = "_static"
  beforeAll(async () => {
    await clean(testName)
    const testDir = await tmpdir(testName)
    testFile = path.join(testDir, "test")
    testFileContent = "static file contents"
    nonExistentTestFile = path.join(testDir, "i-am-not-here")
    await fs.writeFile(testFile, testFileContent)
  })

  afterEach(async () => {
    if (_codeServer) {
      await _codeServer.dispose()
      _codeServer = undefined
    }
  })

  function commonTests() {
    it("should return a 404 when a file is not provided", async () => {
      const resp = await codeServer().fetch(`/_static/`)
      expect(resp.status).toBe(NOT_FOUND.code)

      const content = await resp.json()
      expect(content.error).toMatch(NOT_FOUND.message)
    })
  }

  describe("disabled authentication", () => {
    beforeEach(async () => {
      _codeServer = await integration.setup(["--auth=none"], "")
    })

    commonTests()

    it("should return a 404 for a nonexistent file", async () => {
      const filePath = path.join("/_static/", nonExistentTestFile!)

      const resp = await codeServer().fetch(filePath)
      expect(resp.status).toBe(NOT_FOUND.code)
    })

    it("should return a 200 and file contents for an existent file", async () => {
      const resp = await codeServer().fetch("/_static/src/browser/robots.txt")
      expect(resp.status).toBe(200)

      const localFilePath = path.join(rootPath, "src/browser/robots.txt")
      const localFileContent = await fs.readFile(localFilePath, "utf8")

      // console.log(localFileContent)
      const content = await resp.text()
      expect(content).toStrictEqual(localFileContent)
    })
  })
})
