import { RateLimiter } from "../../../../src/node/routes/login"
import { mockLogger } from "../../../utils/helpers"
import * as httpserver from "../../../utils/httpserver"
import * as integration from "../../../utils/integration"

describe("login", () => {
  beforeAll(() => {
    mockLogger()
  })

  describe("RateLimiter", () => {
    it("should allow one try ", () => {
      const limiter = new RateLimiter()
      expect(limiter.removeToken()).toBe(true)
    })

    it("should pull tokens from both limiters (minute & hour)", () => {
      const limiter = new RateLimiter()

      // Try twice, which pulls two from the minute bucket
      limiter.removeToken()
      limiter.removeToken()

      // Check that we can still try
      // which should be true since there are 12 remaining in the hour bucket
      expect(limiter.canTry()).toBe(true)
      expect(limiter.removeToken()).toBe(true)
    })

    it("should not allow more than 14 tries in less than an hour", () => {
      const limiter = new RateLimiter()

      // The limiter allows 2 tries per minute plus 12 per hour
      // so if we run it 15 times, 14 should return true and the last
      // should return false
      for (let i = 1; i <= 14; i++) {
        expect(limiter.removeToken()).toBe(true)
      }

      expect(limiter.canTry()).toBe(false)
      expect(limiter.removeToken()).toBe(false)
    })
  })
  describe("/login", () => {
    let _codeServer: httpserver.HttpServer | undefined
    function codeServer(): httpserver.HttpServer {
      if (!_codeServer) {
        throw new Error("tried to use code-server before setting it up")
      }
      return _codeServer
    }

    // Store whatever might be in here so we can restore it afterward.
    // TODO: We should probably pass this as an argument somehow instead of
    // manipulating the environment.
    const previousEnvPassword = process.env.PASSWORD

    beforeEach(async () => {
      process.env.PASSWORD = "test"
      _codeServer = await integration.setup(["--auth=password"], "")
    })

    afterEach(async () => {
      process.env.PASSWORD = previousEnvPassword
      if (_codeServer) {
        await _codeServer.dispose()
        _codeServer = undefined
      }
    })

    it("should return 'Missing password' without body", async () => {
      const resp = await codeServer().fetch("/login", { method: "POST" })
      const htmlContent = await resp.text()
      expect(resp.status).toBe(200)
      expect(htmlContent).toContain("Missing password")
    })

    it("should return HTML with 'Incorrect password' message", async () => {
      const params = new URLSearchParams()
      params.append("password", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
      const resp = await codeServer().fetch("/login", {
        method: "POST",
        body: params,
      })

      expect(resp.status).toBe(200)

      const htmlContent = await resp.text()

      expect(htmlContent).toContain("Incorrect password")
    })

    it("should return correct app-name", async () => {
      process.env.PASSWORD = previousEnvPassword
      const appName = "testnäme"
      const codeServer = await integration.setup([`--app-name=${appName}`], "")
      const resp = await codeServer.fetch("/login", { method: "GET" })

      const htmlContent = await resp.text()
      expect(resp.status).toBe(200)
      expect(htmlContent).toContain(`${appName}</h1>`)
      expect(htmlContent).toContain(`<title>${appName} login</title>`)
    })

    it("should return correct app-name when unset", async () => {
      process.env.PASSWORD = previousEnvPassword
      const appName = "code-server"
      const codeServer = await integration.setup([], "")
      const resp = await codeServer.fetch("/login", { method: "GET" })

      const htmlContent = await resp.text()
      expect(resp.status).toBe(200)
      expect(htmlContent).toContain(`${appName}</h1>`)
      expect(htmlContent).toContain(`<title>${appName} login</title>`)
    })

    it("should return correct welcome text", async () => {
      process.env.PASSWORD = previousEnvPassword
      const welcomeText = "Welcome to your code workspace! öäü🔐"
      const codeServer = await integration.setup([`--welcome-text=${welcomeText}`], "")
      const resp = await codeServer.fetch("/login", { method: "GET" })

      const htmlContent = await resp.text()
      expect(resp.status).toBe(200)
      expect(htmlContent).toContain(welcomeText)
    })

    it("should return correct welcome text when none is set but app-name is", async () => {
      process.env.PASSWORD = previousEnvPassword
      const appName = "testnäme"
      const codeServer = await integration.setup([`--app-name=${appName}`], "")
      const resp = await codeServer.fetch("/login", { method: "GET" })

      const htmlContent = await resp.text()
      expect(resp.status).toBe(200)
      expect(htmlContent).toContain(`Welcome to ${appName}`)
    })

    it("should return correct welcome text when locale is set to non-English", async () => {
      process.env.PASSWORD = previousEnvPassword
      const locale = "zh-cn"
      const codeServer = await integration.setup([`--locale=${locale}`], "")
      const resp = await codeServer.fetch("/login", { method: "GET" })

      const htmlContent = await resp.text()
      expect(resp.status).toBe(200)
      expect(htmlContent).toContain(`欢迎来到 code-server`)
    })
  })
})
