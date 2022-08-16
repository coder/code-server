import { describe, test, expect } from "./baseFixture"

describe("login", ["--auth", "password"], {}, () => {
  test("should hit the rate limiter for too many unsuccessful logins", async ({ codeServerPage }) => {
    // Type in password
    await codeServerPage.page.fill(".password", "password123")
    // Click the submit button and login
    // The current RateLimiter allows 2 logins per minute plus
    // 12 logins per hour for a total of 14
    // See: src/node/routes/login.ts
    for (let i = 1; i <= 14; i++) {
      await codeServerPage.page.click(".submit")
      await codeServerPage.page.waitForLoadState("networkidle")
      // We double-check that the correct error message shows
      // which should be for incorrect password
      expect(await codeServerPage.page.isVisible("text=Incorrect password"))
    }

    // The 15th should fail for a different reason:
    // login rate
    await codeServerPage.page.click(".submit")
    await codeServerPage.page.waitForLoadState("networkidle")
    expect(await codeServerPage.page.isVisible("text=Login rate limited!"))
  })
})
