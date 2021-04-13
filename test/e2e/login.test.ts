import { test, expect } from "@playwright/test"
import { CODE_SERVER_ADDRESS, PASSWORD } from "../utils/constants"

test.describe("login", () => {
  test.beforeEach(async ({ page }) => {
    // TODO@jsjoeio reset the browser
    await page.goto(CODE_SERVER_ADDRESS, { waitUntil: "networkidle" })
  })

  test("should be able to login", async ({ page }) => {
    // Type in password
    await page.fill(".password", PASSWORD)
    // Click the submit button and login
    await page.click(".submit")
    await page.waitForLoadState("networkidle")
    // Make sure the editor actually loaded
    expect(await page.isVisible("div.monaco-workbench"))
  })
})
