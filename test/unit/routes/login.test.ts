import * as httpserver from "../../utils/httpserver"
import * as integration from "../../utils/integration"

import { RateLimiter } from "../../../src/node/routes/login"

describe("login", () => {
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

    afterEach(() => {
      process.env.PASSWORD = previousEnvPassword
    })

    it("should return escaped HTML with 'Missing password' message", async () => {
      const resp = await codeServer().fetch("/login", { method: "POST" })

      expect(resp.status).toBe(200)

      const htmlContent = await resp.text()

      expect(htmlContent).not.toContain(">")
      expect(htmlContent).not.toContain("<")
      expect(htmlContent).not.toContain('"')
      expect(htmlContent).not.toContain("'")
      expect(htmlContent).toContain("&lt;div class=&quot;error&quot;&gt;Missing password&lt;/div&gt;")
    })
  })
})
