import { test, expect } from "@playwright/test"
import { CodeServer } from "./models/CodeServer"

// This is a "gut-check" test to make sure playwright is working as expected
test.describe("browser", () => {
  let codeServer: CodeServer

  test.beforeEach(async ({ page }) => {
    codeServer = new CodeServer(page)
    await codeServer.navigate()
  })

  test("browser should display correct userAgent", async ({ page, browserName }) => {
    const displayNames = {
      chromium: "Chrome",
      firefox: "Firefox",
      webkit: "Safari",
    }
    const userAgent = await page.evaluate("navigator.userAgent")

    expect(userAgent).toContain(displayNames[browserName])
  })
})
