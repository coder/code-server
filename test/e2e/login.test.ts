import { test, expect } from "@playwright/test"
import { PASSWORD } from "../utils/constants"
import { CodeServer } from "./models/CodeServer"

test.describe("login", () => {
  // Reset the browser so no cookies are persisted
  // by emptying the storageState
  const options = {
    contextOptions: {
      storageState: {},
    },
  }
  let codeServer: CodeServer

  test.beforeEach(async ({ page }) => {
    codeServer = new CodeServer(page)
    await codeServer.navigate()
  })

  test("should see the login page", options, async ({ page }) => {
    // It should send us to the login page
    expect(await page.title()).toBe("code-server login")
  })

  test("should be able to login", options, async ({ page }) => {
    // Type in password
    await page.fill(".password", PASSWORD)
    // Click the submit button and login
    await page.click(".submit")
    await page.waitForLoadState("networkidle")
    // We do this because occassionally code-server doesn't load on Firefox
    // but loads if you reload once or twice
    await codeServer.reloadUntilEditorIsReady()
    // Make sure the editor actually loaded
    expect(await codeServer.isEditorVisible()).toBe(true)
  })

  test("should see an error message for missing password", options, async ({ page }) => {
    // Skip entering password
    // Click the submit button and login
    await page.click(".submit")
    await page.waitForLoadState("networkidle")
    expect(await page.isVisible("text=Missing password"))
  })

  test("should see an error message for incorrect password", options, async ({ page }) => {
    // Type in password
    await page.fill(".password", "password123")
    // Click the submit button and login
    await page.click(".submit")
    await page.waitForLoadState("networkidle")
    expect(await page.isVisible("text=Incorrect password"))
  })

  test("should hit the rate limiter for too many unsuccessful logins", options, async ({ page }) => {
    // Type in password
    await page.fill(".password", "password123")
    // Click the submit button and login
    // The current RateLimiter allows 2 logins per minute plus
    // 12 logins per hour for a total of 14
    // See: src/node/routes/login.ts
    for (let i = 1; i <= 14; i++) {
      await page.click(".submit")
      await page.waitForLoadState("networkidle")
      // We double-check that the correct error message shows
      // which should be for incorrect password
      expect(await page.isVisible("text=Incorrect password"))
    }

    // The 15th should fail for a different reason:
    // login rate
    await page.click(".submit")
    await page.waitForLoadState("networkidle")
    expect(await page.isVisible("text=Login rate limited!"))
  })
})
