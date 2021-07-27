import { promises as fs } from "fs"
import * as path from "path"
import { tmpdir } from "../../../utils/helpers"
import * as httpserver from "../../../utils/httpserver"
import * as integration from "../../../utils/integration"

describe("/static", () => {
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

  // The static endpoint expects a commit and then the full path of the file.
  // The commit is just for cache busting so we can use anything we want. `-`
  // and `development` are specially recognized in that they will cause the
  // static endpoint to avoid sending cache headers.
  const commit = "-"

  beforeAll(async () => {
    const testDir = await tmpdir("static")
    testFile = path.join(testDir, "test")
    testFileContent = "static file contents"
    nonExistentTestFile = path.join(testDir, "i-am-not-here")
    await fs.writeFile(testFile, testFileContent)
  })

  afterEach(async () => {
    if (_codeServer) {
      await _codeServer.close()
      _codeServer = undefined
    }
  })

  function commonTests() {
    it("should return a 404 when a commit and file are not provided", async () => {
      const resp = await codeServer().fetch("/static")
      expect(resp.status).toBe(404)

      const content = await resp.json()
      expect(content).toStrictEqual({ error: "Not Found" })
    })

    it("should return a 404 when a file is not provided", async () => {
      const resp = await codeServer().fetch(`/static/${commit}`)
      expect(resp.status).toBe(404)

      const content = await resp.json()
      expect(content).toStrictEqual({ error: "Not Found" })
    })
  }

  describe("disabled authentication", () => {
    beforeEach(async () => {
      _codeServer = await integration.setup(["--auth=none"], "")
    })

    commonTests()

    it("should return a 404 for a nonexistent file", async () => {
      const resp = await codeServer().fetch(`/static/${commit}/${nonExistentTestFile}`)
      expect(resp.status).toBe(404)

      const content = await resp.json()
      expect(content.error).toMatch("ENOENT")
    })

    it("should return a 200 and file contents for an existent file", async () => {
      const resp = await codeServer().fetch(`/static/${commit}${testFile}`)
      expect(resp.status).toBe(200)

      const content = await resp.text()
      expect(content).toStrictEqual(testFileContent)
    })
  })

  describe("enabled authentication", () => {
    // Store whatever might be in here so we can restore it afterward.
    // TODO: We should probably pass this as an argument somehow instead of
    // manipulating the environment.
    const previousEnvPassword = process.env.PASSWORD

    beforeEach(async () => {
      process.env.PASSWORD = "test"
      _codeServer = await integration.setup(["--auth=password"], "")
    })

    afterEach(() => {
      process.env.PASSWORD = previousEnvPassword
    })

    commonTests()

    describe("inside code-server root", () => {
      it("should return a 404 for a nonexistent file", async () => {
        const resp = await codeServer().fetch(`/static/${commit}/${__filename}-does-not-exist`)
        expect(resp.status).toBe(404)

        const content = await resp.json()
        expect(content.error).toMatch("ENOENT")
      })

      it("should return a 200 and file contents for an existent file", async () => {
        const resp = await codeServer().fetch(`/static/${commit}${__filename}`)
        expect(resp.status).toBe(200)

        const content = await resp.text()
        expect(content).toStrictEqual(await fs.readFile(__filename, "utf8"))
      })
    })

    describe("outside code-server root", () => {
      it("should return a 401 for a nonexistent file", async () => {
        const resp = await codeServer().fetch(`/static/${commit}/${nonExistentTestFile}`)
        expect(resp.status).toBe(401)

        const content = await resp.json()
        expect(content).toStrictEqual({ error: "Unauthorized" })
      })

      it("should return a 401 for an existent file", async () => {
        const resp = await codeServer().fetch(`/static/${commit}${testFile}`)
        expect(resp.status).toBe(401)

        const content = await resp.json()
        expect(content).toStrictEqual({ error: "Unauthorized" })
      })
    })
  })
})
