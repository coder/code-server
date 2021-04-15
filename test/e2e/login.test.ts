import { test, expect } from "@playwright/test"
import { CODE_SERVER_ADDRESS, PASSWORD } from "../utils/constants"

test.describe("login", () => {
  // Reset the browser so no cookies are persisted
  // by emptying the storageState
  const options = {
    contextOptions: {
      storageState: {},
    },
  }

  test("should see the login page", options, async ({ page }) => {
    await page.goto(CODE_SERVER_ADDRESS, { waitUntil: "networkidle" })
    // It should send us to the login page
    expect(await page.title()).toBe("code-server login")
  })

  test("should be able to login", options, async ({ page }) => {
    await page.goto(CODE_SERVER_ADDRESS, { waitUntil: "networkidle" })
    // Type in password
    await page.fill(".password", PASSWORD)
    // Click the submit button and login
    await page.click(".submit")
    await page.waitForLoadState("networkidle")
    // Make sure the editor actually loaded
    expect(await page.isVisible("div.monaco-workbench"))
  })

  test("should see an error message for missing password", options, async ({ page }) => {
    await page.goto(CODE_SERVER_ADDRESS, { waitUntil: "networkidle" })
    // Skip entering password
    // Click the submit button and login
    await page.click(".submit")
    await page.waitForLoadState("networkidle")
    expect(await page.isVisible("text=Missing password"))
  })

  test("should see an error message for incorrect password", options, async ({ page }) => {
    await page.goto(CODE_SERVER_ADDRESS, { waitUntil: "networkidle" })
    // Type in password
    await page.fill(".password", "password123")
    // Click the submit button and login
    await page.click(".submit")
    await page.waitForLoadState("networkidle")
    expect(await page.isVisible("text=Incorrect password"))
  })

  test("should hit the rate limiter for too many unsuccessful logins", options, async ({ page }) => {
    await page.goto(CODE_SERVER_ADDRESS, { waitUntil: "networkidle" })
    // Type in password
    await page.fill(".password", "password123")
    // Click the submit button and login
    // The current RateLimiter allows 2 logins per minute plus
    // 12 logins per hour for a total of 14
    // See: src/node/routes/login.ts
    for (let i = 1; i <= 14; i++) {
      await page.click(".submit")
      await page.waitForLoadState("networkidle")
    }

    // The 15th should fail
    await page.click(".submit")
    await page.waitForLoadState("networkidle")
    expect(await page.isVisible("text=Login rate limited!"))
  })

  // This test takes 8mins to run and is probably not worth adding to our e2e suite
  // test.only("should not count successful logins against the rate limiter", options, async ({ page }) => {
  //   for (let i = 1; i <= 14; i++) {
  //     await page.goto(CODE_SERVER_ADDRESS, { waitUntil: "networkidle" })
  //     await page.fill(".password", PASSWORD)
  //     await page.click(".submit")
  //     await page.waitForLoadState("networkidle")
  //     // Make sure the editor actually loaded
  //     await page.isVisible("div.monaco-workbench")

  //     // Delete cookie
  //     await page.evaluate(() => {
  //       document.cookie = "key" + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;"
  //       return Promise.resolve()
  //     })

  //     // Go back to address, which should be the login page
  //     await page.goto(CODE_SERVER_ADDRESS, { waitUntil: "networkidle" })
  //   }

  //   // On the 15th time, we should see the editor
  //   await page.fill(".password", PASSWORD)
  //   await page.click(".submit")
  //   await page.waitForLoadState("networkidle")
  //   // Make sure the editor actually loaded
  //   expect(await page.isVisible("div.monaco-workbench"))
  // })
})
