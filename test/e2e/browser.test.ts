import { test, expect } from "@playwright/test"

test("should display correct browser based on userAgent", async ({ page, browserName }) => {
  const displayNames = {
    chromium: "Chrome",
    firefox: "Firefox",
    webkit: "Safari",
  }
  const userAgent = await page.evaluate("navigator.userAgent")

  if (browserName === "chromium") {
    expect(userAgent).toContain(displayNames[browserName])
  }

  if (browserName === "firefox") {
    expect(userAgent).toContain(displayNames[browserName])
  }

  if (browserName === "webkit") {
    expect(userAgent).toContain(displayNames[browserName])
  }
})
