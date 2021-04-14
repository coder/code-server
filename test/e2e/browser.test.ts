import { test, expect } from "@playwright/test"
import { CODE_SERVER_ADDRESS } from "../utils/constants"

// This is a "gut-check" test to make sure playwright is working as expected
test("browser should display correct userAgent", async ({ page, browserName }) => {
  const displayNames = {
    chromium: "Chrome",
    firefox: "Firefox",
    webkit: "Safari",
  }
  await page.goto(CODE_SERVER_ADDRESS, { waitUntil: "networkidle" })
  const userAgent = await page.evaluate("navigator.userAgent")

  expect(userAgent).toContain(displayNames[browserName])
})
