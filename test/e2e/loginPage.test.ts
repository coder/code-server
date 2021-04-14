import { test, expect } from "@playwright/test"
import { CODE_SERVER_ADDRESS } from "../utils/constants"

test.describe("login page", () => {
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
})
