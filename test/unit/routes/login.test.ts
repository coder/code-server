import { RateLimiter } from "../../../src/node/routes/login"

describe("login", () => {
  describe("RateLimiter", () => {
    it("should allow one try ", () => {
      const limiter = new RateLimiter()
      expect(limiter.try()).toBe(true)
    })

    it("should not allow more than 14 tries in less than an hour", () => {
      const limiter = new RateLimiter()

      // The limiter allows 2 tries per minute plus 12 per hour
      // so if we run it 15 times, 14 should return true and the last
      // should return false
      for (let i = 1; i <= 14; i++) {
        expect(limiter.try()).toBe(true)
      }

      expect(limiter.try()).toBe(false)
    })
  })
})
