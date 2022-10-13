import { PASSWORD } from "../utils/constants"
import { describe, test, expect } from "./baseFixture"

describe("login", ["--disable-workspace-trust", "--auth", "password"], {}, () => {
  test("should see the login page", async ({ codeServerPage }) => {
    // It should send us to the login page
    expect(await codeServerPage.page.title()).toBe("code-server login")
  })

  test("should be able to login", async ({ codeServerPage }) => {
    // Type in password
    await codeServerPage.page.fill(".password", PASSWORD)
    // Click the submit button and login
    await codeServerPage.page.click(".submit")
    await codeServerPage.page.waitForLoadState("networkidle")
    // We do this because occassionally code-server doesn't load on Firefox
    // but loads if you reload once or twice
    await codeServerPage.reloadUntilEditorIsReady()
    // Make sure the editor actually loaded
    expect(await codeServerPage.isEditorVisible()).toBe(true)
  })

  test("should see an error message for missing password", async ({ codeServerPage }) => {
    // Skip entering password
    // Click the submit button and login
    await codeServerPage.page.click(".submit")
    await codeServerPage.page.waitForLoadState("networkidle")
    expect(await codeServerPage.page.isVisible("text=Missing password"))
  })

  test("should see an error message for incorrect password", async ({ codeServerPage }) => {
    // Type in password
    await codeServerPage.page.fill(".password", "password123")
    // Click the submit button and login
    await codeServerPage.page.click(".submit")
    await codeServerPage.page.waitForLoadState("networkidle")
    expect(await codeServerPage.page.isVisible("text=Incorrect password"))
  })

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
