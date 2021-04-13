import { test, expect } from "@playwright/test"
import { CODE_SERVER_ADDRESS } from "../utils/constants"

test.describe("login page", () => {
  test.beforeEach(async ({ page }) => {
    // TODO@jsjoeio reset context somehow
    await page.goto(CODE_SERVER_ADDRESS, { waitUntil: "networkidle" })
  })

  test("should see the login page", async ({ page }) => {
    // It should send us to the login page
    expect(await page.title()).toBe("code-server login")
  })
})
